export interface TaskItem {
  id: string;
  title: string;
  completed: boolean;
  priority: 'low' | 'medium' | 'high';
  dueTime: string;
  category?: string;
}

export interface ProductivityMetric {
  title: string;
  value: string | number;
  change?: string;
  changeType?: 'positive' | 'negative' | 'neutral';
  icon: string;
  description: string;
}

export interface ActivityEvent {
  id: string;
  type: 'auth' | 'session' | 'system';
  title: string;
  timestamp: string;
  details?: string;
}
