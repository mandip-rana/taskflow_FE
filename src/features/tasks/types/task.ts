export const taskStatuses = ['todo', 'in_progress', 'completed', 'cancelled'] as const;
export type TaskStatus = (typeof taskStatuses)[number];

export const taskPriorities = ['low', 'medium', 'high', 'critical'] as const;
export type TaskPriority = (typeof taskPriorities)[number];

export interface TaskChecklistItem {
  id: string;
  title: string;
  isCompleted: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

export interface TaskChecklistSummary {
  total: number;
  completed: number;
  pending: number;
}

export interface Task {
  id: string;
  taskNumber?: number;
  taskCode?: string;
  title: string;
  description: string;
  status: TaskStatus;
  priority: TaskPriority;
  dueDate: string | null;
  checklistItems?: TaskChecklistItem[];
  checklistSummary?: TaskChecklistSummary;
  createdAt: string;
  updatedAt: string;
}

export interface TaskInput {
  title: string;
  description: string;
  status: TaskStatus;
  priority: TaskPriority;
  dueDate: string | null;
  checklistItems?: Array<{
    title: string;
    isCompleted?: boolean;
  }>;
}

export interface TaskStats {
  total: number;
  byStatus: Record<TaskStatus, number>;
  byPriority: Record<TaskPriority, number>;
  overdue: number;
  dueSoon: number;
  completionRate: number;
}

export interface TaskFilters {
  search: string;
  status: TaskStatus | '';
  priority: TaskPriority | '';
  sortBy: 'createdAt' | 'dueDate';
  order: 'asc' | 'desc';
  dateFrom?: string;
  dateTo?: string;
}

export const statusLabels: Record<TaskStatus, string> = {
  todo: 'To Do',
  in_progress: 'In Progress',
  completed: 'Completed',
  cancelled: 'Cancelled',
};

export const priorityLabels: Record<TaskPriority, string> = {
  low: 'Low',
  medium: 'Medium',
  high: 'High',
  critical: 'Critical',
};
