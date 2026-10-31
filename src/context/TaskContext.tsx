import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import { Task, TaskFormData, TaskStats } from '../types/task';
import { taskService } from '../services/taskService';
import { useAuth } from './AuthContext';

interface TaskContextType {
  tasks: Task[];
  stats: TaskStats;
  isLoading: boolean;
  addTask: (data: TaskFormData) => Promise<Task>;
  updateTask: (id: string, data: Partial<TaskFormData>) => Promise<Task | null>;
  deleteTask: (id: string) => Promise<boolean>;
  toggleTask: (id: string) => Promise<Task | null>;
  refreshTasks: () => Promise<void>;
}

const TaskContext = createContext<TaskContextType | undefined>(undefined);

export const TaskProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const userId = user?.id;

  const [tasks, setTasks] = useState<Task[]>(() => taskService.getTasks(userId));
  const [isLoading, setIsLoading] = useState<boolean>(Boolean(userId));

  // Sync tasks whenever authenticated user changes
  useEffect(() => {
    let isMounted = true;

    if (!userId) {
      setTasks([]);
      setIsLoading(false);
      return;
    }

    // 1. Immediately hydrate with cached user-scoped real tasks
    const cached = taskService.getTasks(userId);
    setTasks(cached);
    setIsLoading(true);

    // 2. Fetch live records from Supabase account
    taskService.fetchTasks(userId)
      .then((remoteTasks) => {
        if (isMounted) {
          setTasks(remoteTasks);
          setIsLoading(false);
        }
      })
      .catch((err) => {
        console.warn('Error fetching live Supabase tasks:', err);
        if (isMounted) {
          setIsLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [userId]);

  const refreshTasks = useCallback(async () => {
    if (!userId) {
      setTasks([]);
      return;
    }
    const remote = await taskService.fetchTasks(userId);
    setTasks(remote);
  }, [userId]);

  // Listen to storage events for multi-tab synchronization
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (userId && e.key === `nexa_workspace_tasks_${userId}`) {
        setTasks(taskService.getTasks(userId));
      }
    };
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [userId]);

  const addTask = useCallback(
    async (data: TaskFormData): Promise<Task> => {
      const created = await taskService.createTask(data, userId);
      setTasks(taskService.getTasks(userId));
      return created;
    },
    [userId]
  );

  const updateTask = useCallback(
    async (id: string, data: Partial<TaskFormData>): Promise<Task | null> => {
      const updated = await taskService.updateTask(id, data, userId);
      setTasks(taskService.getTasks(userId));
      return updated;
    },
    [userId]
  );

  const deleteTask = useCallback(
    async (id: string): Promise<boolean> => {
      const deleted = await taskService.deleteTask(id, userId);
      setTasks(taskService.getTasks(userId));
      return deleted;
    },
    [userId]
  );

  const toggleTask = useCallback(
    async (id: string): Promise<Task | null> => {
      const toggled = await taskService.toggleComplete(id, userId);
      setTasks(taskService.getTasks(userId));
      return toggled;
    },
    [userId]
  );

  const stats = useMemo(() => taskService.computeStats(tasks), [tasks]);

  return (
    <TaskContext.Provider
      value={{
        tasks,
        stats,
        isLoading,
        addTask,
        updateTask,
        deleteTask,
        toggleTask,
        refreshTasks,
      }}
    >
      {children}
    </TaskContext.Provider>
  );
};

export const useTasks = (): TaskContextType => {
  const context = useContext(TaskContext);
  if (!context) {
    throw new Error('useTasks must be used within a TaskProvider');
  }
  return context;
};
