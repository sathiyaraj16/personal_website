import { Task, TaskFilter, TaskSort, TaskStats, TaskFormData } from '../types/task';
import { supabase, isSupabaseConfigured } from '../lib/supabase';

const LEGACY_STORAGE_KEY = 'nexa_workspace_tasks_v1';
const USER_STORAGE_PREFIX = 'nexa_workspace_tasks_';

const DEMO_TASK_IDS = new Set([
  'task-1',
  'task-2',
  'task-3',
  'task-4',
  'task-5',
  'task-6',
  'task-7',
]);

// In-memory fallback for SSR or Vitest Node test environments
const memoryStorage = new Map<string, string>();

export const safeTaskStorage = {
  getItem: (key: string): string | null => {
    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        return window.localStorage.getItem(key);
      } catch {
        return memoryStorage.get(key) || null;
      }
    }
    return memoryStorage.get(key) || null;
  },
  setItem: (key: string, value: string): void => {
    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        window.localStorage.setItem(key, value);
      } catch {
        // fallback to memory
      }
    }
    memoryStorage.set(key, value);
  },
  removeItem: (key: string): void => {
    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        window.localStorage.removeItem(key);
      } catch {
        // fallback
      }
    }
    memoryStorage.delete(key);
  },
  clear: (): void => {
    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        window.localStorage.clear();
      } catch {
        // fallback
      }
    }
    memoryStorage.clear();
  },
};

function getStorageKey(userId?: string): string {
  if (userId) {
    return `${USER_STORAGE_PREFIX}${userId}`;
  }
  return 'nexa_workspace_tasks_unauth';
}

function sanitizeTasks(rawTasks: unknown[]): Task[] {
  if (!Array.isArray(rawTasks)) return [];
  return rawTasks.filter((t): t is Task => {
    if (!t || typeof t !== 'object') return false;
    const task = t as Partial<Task>;
    // Exclude hardcoded demo tasks
    if (task.id && DEMO_TASK_IDS.has(task.id)) return false;
    return typeof task.id === 'string' && typeof task.title === 'string';
  });
}

export const taskService = {
  /**
   * Remove legacy demo storage if present
   */
  cleanupLegacyStorage(): void {
    try {
      safeTaskStorage.removeItem(LEGACY_STORAGE_KEY);
    } catch {
      // Ignore
    }
  },

  /**
   * Get cached real tasks for the authenticated user from user-scoped storage.
   * Returns empty array if no tasks exist. NEVER seeds demo data.
   */
  getTasks(userId?: string): Task[] {
    if (!userId) {
      return [];
    }

    try {
      this.cleanupLegacyStorage();
      const storageKey = getStorageKey(userId);
      const data = safeTaskStorage.getItem(storageKey);
      if (!data) {
        return [];
      }
      const parsed = JSON.parse(data);
      return sanitizeTasks(parsed);
    } catch (e) {
      console.warn('Failed to parse cached user tasks:', e);
      return [];
    }
  },

  /**
   * Save user-scoped real tasks to local storage
   */
  saveTasks(tasks: Task[], userId?: string): void {
    if (!userId) return;
    try {
      const storageKey = getStorageKey(userId);
      const sanitized = sanitizeTasks(tasks);
      safeTaskStorage.setItem(storageKey, JSON.stringify(sanitized));
    } catch (e) {
      console.warn('Failed to save tasks to local storage:', e);
    }
  },

  /**
   * Fetch tasks directly from the authenticated user's Supabase account.
   * Scoped strictly by user_id. Falls back to user-scoped cache if offline or table unmigrated.
   */
  async fetchTasks(userId: string): Promise<Task[]> {
    if (!userId) return [];

    // 1. If Supabase is configured, attempt real database query
    if (isSupabaseConfigured) {
      try {
        const { data, error } = await supabase
          .from('tasks')
          .select('*')
          .eq('user_id', userId)
          .order('created_at', { ascending: false });

        if (!error && Array.isArray(data)) {
          const remoteTasks = sanitizeTasks(data);
          this.saveTasks(remoteTasks, userId);
          return remoteTasks;
        }
      } catch (err) {
        console.warn('Supabase tasks query encountered an issue, reading local cache:', err);
      }
    }

    // 2. Fall back to user-scoped cached records
    return this.getTasks(userId);
  },

  /**
   * Create a new task for the authenticated user
   */
  async createTask(data: TaskFormData, userId?: string): Promise<Task> {
    const tasks = this.getTasks(userId);
    const nowIso = new Date().toISOString();
    const newTask: Task = {
      id: `task-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      user_id: userId,
      title: data.title.trim(),
      description: data.description.trim(),
      category: data.category,
      priority: data.priority,
      status: data.status,
      due_date: data.due_date,
      due_time: data.due_time || '12:00 PM',
      created_at: nowIso,
      updated_at: nowIso,
      completed_at: data.status === 'completed' ? nowIso : null,
    };

    tasks.unshift(newTask);
    this.saveTasks(tasks, userId);

    if (userId && isSupabaseConfigured) {
      try {
        await supabase.from('tasks').insert(newTask);
      } catch (err) {
        console.warn('Supabase tasks insert warning:', err);
      }
    }

    return newTask;
  },

  /**
   * Update an existing task for the authenticated user
   */
  async updateTask(id: string, data: Partial<TaskFormData>, userId?: string): Promise<Task | null> {
    const tasks = this.getTasks(userId);
    const index = tasks.findIndex((t) => t.id === id);
    if (index === -1) return null;

    const existing = tasks[index];
    const nowIso = new Date().toISOString();
    const updatedStatus = data.status ?? existing.status;

    const updatedTask: Task = {
      ...existing,
      ...data,
      title: data.title !== undefined ? data.title.trim() : existing.title,
      description: data.description !== undefined ? data.description.trim() : existing.description,
      status: updatedStatus,
      updated_at: nowIso,
      completed_at:
        updatedStatus === 'completed'
          ? existing.completed_at || nowIso
          : null,
    };

    tasks[index] = updatedTask;
    this.saveTasks(tasks, userId);

    if (userId && isSupabaseConfigured) {
      try {
        await supabase
          .from('tasks')
          .update({
            ...data,
            updated_at: nowIso,
            completed_at: updatedTask.completed_at,
          })
          .eq('id', id)
          .eq('user_id', userId);
      } catch (err) {
        console.warn('Supabase tasks update warning:', err);
      }
    }

    return updatedTask;
  },

  /**
   * Toggle task completion status
   */
  async toggleComplete(id: string, userId?: string): Promise<Task | null> {
    const tasks = this.getTasks(userId);
    const task = tasks.find((t) => t.id === id);
    if (!task) return null;

    const isCompleted = task.status === 'completed';
    const newStatus: Task['status'] = isCompleted ? 'pending' : 'completed';
    return this.updateTask(id, { status: newStatus }, userId);
  },

  /**
   * Delete a task for the authenticated user
   */
  async deleteTask(id: string, userId?: string): Promise<boolean> {
    const tasks = this.getTasks(userId);
    const filtered = tasks.filter((t) => t.id !== id);
    if (filtered.length === tasks.length) return false;

    this.saveTasks(filtered, userId);

    if (userId && isSupabaseConfigured) {
      try {
        await supabase.from('tasks').delete().eq('id', id).eq('user_id', userId);
      } catch (err) {
        console.warn('Supabase tasks delete warning:', err);
      }
    }

    return true;
  },

  /**
   * Check if a task is overdue (due_date earlier than today and not completed)
   */
  isTaskOverdue(task: Task, todayStr: string): boolean {
    if (task.status === 'completed') return false;
    if (!task.due_date) return false;
    return task.due_date < todayStr;
  },

  /**
   * Check if a task is due today
   */
  isTaskDueToday(task: Task, todayStr: string): boolean {
    return task.due_date === todayStr;
  },

  /**
   * Compute aggregate statistics purely from real task data.
   * Returns exact 0s and 0% rate when no tasks exist.
   */
  computeStats(tasks: Task[]): TaskStats {
    const todayStr = new Date().toISOString().split('T')[0];
    const total = tasks.length;
    const completed = tasks.filter((t) => t.status === 'completed').length;
    const inProgress = tasks.filter((t) => t.status === 'in_progress').length;
    const overdue = tasks.filter((t) => this.isTaskOverdue(t, todayStr)).length;
    const rate = total > 0 ? Math.round((completed / total) * 100) : 0;

    return {
      total,
      completed,
      inProgress,
      overdue,
      rate,
    };
  },

  /**
   * Filter and sort tasks
   */
  filterAndSortTasks(
    tasks: Task[],
    statusFilter: TaskFilter,
    categoryFilter: string,
    searchQuery: string,
    sortBy: TaskSort
  ): Task[] {
    const todayStr = new Date().toISOString().split('T')[0];

    // 1. Status Filter
    let filtered = tasks.filter((task) => {
      switch (statusFilter) {
        case 'today':
          return task.due_date === todayStr;
        case 'upcoming':
          return task.due_date > todayStr && task.status !== 'completed';
        case 'completed':
          return task.status === 'completed';
        case 'overdue':
          return this.isTaskOverdue(task, todayStr);
        case 'all':
        default:
          return true;
      }
    });

    // 2. Category Filter
    if (categoryFilter && categoryFilter !== 'All') {
      filtered = filtered.filter((task) => task.category === categoryFilter);
    }

    // 3. Search Query (title and description)
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      filtered = filtered.filter(
        (task) =>
          task.title.toLowerCase().includes(q) ||
          task.description.toLowerCase().includes(q)
      );
    }

    // 4. Sort
    filtered.sort((a, b) => {
      if (sortBy === 'due_date') {
        const dateA = a.due_date || '9999-99-99';
        const dateB = b.due_date || '9999-99-99';
        return dateA.localeCompare(dateB);
      }
      if (sortBy === 'priority') {
        const priorityWeight = { high: 3, medium: 2, low: 1 };
        return priorityWeight[b.priority] - priorityWeight[a.priority];
      }
      if (sortBy === 'created_at') {
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      }
      return 0;
    });

    return filtered;
  },
};
