import { describe, it, expect, beforeEach, vi } from 'vitest';

vi.mock('../lib/supabase', () => ({
  isSupabaseConfigured: false,
  supabase: {
    from: () => ({
      select: () => ({ eq: () => ({ order: () => Promise.resolve({ data: [], error: null }) }) }),
      insert: () => Promise.resolve({ data: null, error: null }),
      update: () => ({ eq: () => ({ eq: () => Promise.resolve({ data: null, error: null }) }) }),
      delete: () => ({ eq: () => ({ eq: () => Promise.resolve({ data: null, error: null }) }) }),
    }),
  },
  getSupabaseConfigStatus: () => ({ configured: false, message: 'Isolated Test Mock' }),
}));

import { taskService, safeTaskStorage } from '../services/taskService';
import { Task, TaskFormData } from '../types/task';

describe('NEXA Dashboard & To-Do Manager – Real Data & Demo Cleanup Tests', () => {
  const aliceUserId = 'user-alice-1111-2222';
  const bobUserId = 'user-bob-3333-4444';

  beforeEach(() => {
    safeTaskStorage.clear();
    vi.clearAllMocks();
  });

  describe('1. Demo Data Purge & Zero-Auto-Seed Verification', () => {
    it('returns an empty array when an account has no tasks, without automatically creating demo tasks', () => {
      const tasks = taskService.getTasks(aliceUserId);
      expect(tasks).toEqual([]);
      expect(tasks.length).toBe(0);

      // Verify that storage does NOT have any seeded demo tasks
      const stored = safeTaskStorage.getItem(`nexa_workspace_tasks_${aliceUserId}`);
      expect(stored).toBeNull();
    });

    it('returns an empty array when userId is undefined', () => {
      const tasks = taskService.getTasks(undefined);
      expect(tasks).toEqual([]);
    });

    it('filters out and purges any legacy demo task IDs (task-1 to task-7)', () => {
      // Simulate dirty legacy storage containing demo records
      const legacyMockWithDemos = [
        {
          id: 'task-1',
          title: 'Review NEXA architecture and API endpoints',
          category: 'Work',
          priority: 'high',
          status: 'completed',
        },
        {
          id: 'task-2',
          title: 'Verify Supabase Google OAuth callback redirect',
          category: 'Work',
          priority: 'high',
          status: 'completed',
        },
        {
          id: 'real-user-task-99',
          title: 'Real Authenticated Task',
          category: 'Personal',
          priority: 'medium',
          status: 'pending',
          due_date: '2026-11-05',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      ];

      safeTaskStorage.setItem(`nexa_workspace_tasks_${aliceUserId}`, JSON.stringify(legacyMockWithDemos));

      const tasks = taskService.getTasks(aliceUserId);
      expect(tasks.length).toBe(1);
      expect(tasks[0].id).toBe('real-user-task-99');
      expect(tasks.find((t) => t.id === 'task-1')).toBeUndefined();
      expect(tasks.find((t) => t.id === 'task-2')).toBeUndefined();
    });

    it('cleans up legacy global STORAGE_KEY if present', () => {
      safeTaskStorage.setItem('nexa_workspace_tasks_v1', JSON.stringify([{ id: 'task-1' }]));
      taskService.cleanupLegacyStorage();
      expect(safeTaskStorage.getItem('nexa_workspace_tasks_v1')).toBeNull();
    });
  });

  describe('2. Account Isolation & Scoped User Persistence', () => {
    it('ensures Alice tasks are isolated and never visible to Bob', async () => {
      const aliceTaskData: TaskFormData = {
        title: 'Alice Private Project Deliverable',
        description: 'Confidential client report',
        category: 'Work',
        priority: 'high',
        status: 'pending',
        due_date: '2026-11-10',
        due_time: '10:00 AM',
      };

      const created = await taskService.createTask(aliceTaskData, aliceUserId);
      expect(created.user_id).toBe(aliceUserId);

      // Verify Alice has 1 task
      const aliceTasks = taskService.getTasks(aliceUserId);
      expect(aliceTasks.length).toBe(1);
      expect(aliceTasks[0].title).toBe('Alice Private Project Deliverable');

      // Verify Bob has 0 tasks
      const bobTasks = taskService.getTasks(bobUserId);
      expect(bobTasks).toEqual([]);
      expect(bobTasks.length).toBe(0);
    });
  });

  describe('3. Statistics Computation on Real vs Empty Data', () => {
    it('computes exact 0s and 0% completion rate when no tasks exist (no fabricated metrics)', () => {
      const emptyTasks: Task[] = [];
      const stats = taskService.computeStats(emptyTasks);

      expect(stats.total).toBe(0);
      expect(stats.completed).toBe(0);
      expect(stats.inProgress).toBe(0);
      expect(stats.overdue).toBe(0);
      expect(stats.rate).toBe(0);
    });

    it('computes accurate metrics from real user tasks', () => {
      const realTasks: Task[] = [
        {
          id: 'task-real-1',
          user_id: aliceUserId,
          title: 'Task One',
          description: '',
          category: 'Work',
          priority: 'high',
          status: 'completed',
          due_date: '2026-10-25',
          due_time: '12:00 PM',
          created_at: '2026-10-20T00:00:00.000Z',
          updated_at: '2026-10-25T00:00:00.000Z',
          completed_at: '2026-10-25T00:00:00.000Z',
        },
        {
          id: 'task-real-2',
          user_id: aliceUserId,
          title: 'Task Two',
          description: '',
          category: 'Projects',
          priority: 'medium',
          status: 'in_progress',
          due_date: '2099-12-31', // Future date -> not overdue
          due_time: '12:00 PM',
          created_at: '2026-10-20T00:00:00.000Z',
          updated_at: '2026-10-20T00:00:00.000Z',
          completed_at: null,
        },
        {
          id: 'task-real-3',
          user_id: aliceUserId,
          title: 'Task Three',
          description: '',
          category: 'Personal',
          priority: 'low',
          status: 'pending',
          due_date: '2020-01-01', // Past date -> overdue
          due_time: '12:00 PM',
          created_at: '2026-10-20T00:00:00.000Z',
          updated_at: '2026-10-20T00:00:00.000Z',
          completed_at: null,
        },
      ];

      const stats = taskService.computeStats(realTasks);
      expect(stats.total).toBe(3);
      expect(stats.completed).toBe(1);
      expect(stats.inProgress).toBe(1);
      expect(stats.overdue).toBe(1);
      expect(stats.rate).toBe(33); // 1 / 3 = 33%
    });
  });

  describe('4. Real CRUD Operations', () => {
    it('creates, edits, toggles, and deletes real tasks with persistent user-scoped storage', async () => {
      // Create
      const created = await taskService.createTask(
        {
          title: 'Deploy Production API',
          description: 'Deploy to Cloudflare edge',
          category: 'Work',
          priority: 'high',
          status: 'pending',
          due_date: '2026-11-15',
          due_time: '03:00 PM',
        },
        aliceUserId
      );

      expect(created.title).toBe('Deploy Production API');
      expect(created.status).toBe('pending');
      expect(taskService.getTasks(aliceUserId).length).toBe(1);

      // Toggle status
      const toggled = await taskService.toggleComplete(created.id, aliceUserId);
      expect(toggled?.status).toBe('completed');
      expect(toggled?.completed_at).toBeTruthy();
      expect(taskService.getTasks(aliceUserId)[0].status).toBe('completed');

      // Edit description
      const updated = await taskService.updateTask(
        created.id,
        { description: 'Updated deploy instructions' },
        aliceUserId
      );
      expect(updated?.description).toBe('Updated deploy instructions');

      // Delete
      const deleted = await taskService.deleteTask(created.id, aliceUserId);
      expect(deleted).toBe(true);
      expect(taskService.getTasks(aliceUserId).length).toBe(0);
    });
  });
});
