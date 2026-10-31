export type TaskPriority = 'high' | 'medium' | 'low';
export type TaskStatus = 'pending' | 'in_progress' | 'completed';
export type TaskCategory = 'Personal' | 'Study' | 'Work' | 'Projects' | 'Other';
export type TaskFilter = 'all' | 'today' | 'upcoming' | 'completed' | 'overdue';
export type TaskSort = 'due_date' | 'priority' | 'created_at';

export interface Task {
  id: string;
  user_id?: string;
  title: string;
  description: string;
  category: TaskCategory;
  priority: TaskPriority;
  status: TaskStatus;
  due_date: string; // YYYY-MM-DD
  due_time: string; // e.g. 09:30 AM
  created_at: string;
  updated_at: string;
  completed_at?: string | null;
}

export interface TaskFormData {
  title: string;
  description: string;
  category: TaskCategory;
  priority: TaskPriority;
  status: TaskStatus;
  due_date: string;
  due_time: string;
}

export interface TaskStats {
  total: number;
  completed: number;
  inProgress: number;
  overdue: number;
  rate: number;
}
