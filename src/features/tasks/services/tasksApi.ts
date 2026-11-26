import { api } from '../../../services/api';
import type {
  Task,
  TaskFilters,
  TaskInput,
  TaskStats,
  TaskPriority,
  TaskStatus,
} from '../types/task';

interface ApiResponse<T> {
  success: boolean;
  data: T;
  meta?: {
    totalPages: number;
  };
}

interface TaskListParams {
  page: number;
  limit: number;
  search?: string;
  status?: TaskStatus;
  priority?: TaskInput['priority'];
  sortBy: TaskFilters['sortBy'];
  order: TaskFilters['order'];
  dateFrom?: string;
  dateTo?: string;
}

const listPage = (params: TaskListParams, signal?: AbortSignal) =>
  api.get<ApiResponse<Task[]>>('/tasks', { params, signal }).then((response) => response.data);

export const tasksApi = {
  async list(filters: TaskFilters, signal?: AbortSignal): Promise<Task[]> {
    const params: TaskListParams = {
      page: 1,
      limit: 100,
      sortBy: filters.sortBy,
      order: filters.order,
      ...(filters.search.trim() && { search: filters.search.trim() }),
      ...(filters.status && { status: filters.status }),
      ...(filters.priority && { priority: filters.priority }),
      ...(filters.dateFrom && { dateFrom: filters.dateFrom }),
      ...(filters.dateTo && { dateTo: filters.dateTo }),
    };

    const firstPage = await listPage(params, signal);
    const totalPages = firstPage.meta?.totalPages ?? 1;
    if (totalPages <= 1) return firstPage.data;

    const remainingPages = await Promise.all(
      Array.from({ length: totalPages - 1 }, (_, index) =>
        listPage({ ...params, page: index + 2 }, signal),
      ),
    );
    return firstPage.data.concat(...remainingPages.map((page) => page.data));
  },

  async getStats(
    dateRange: Pick<TaskFilters, 'dateFrom' | 'dateTo'>,
    signal?: AbortSignal,
  ): Promise<TaskStats> {
    const params = {
      ...(dateRange.dateFrom && { dateFrom: dateRange.dateFrom }),
      ...(dateRange.dateTo && { dateTo: dateRange.dateTo }),
    };
    const response = await api.get<ApiResponse<TaskStats>>('/tasks/stats', {
      params,
      signal,
    });
    return response.data.data;
  },

  async getById(id: string): Promise<Task> {
    const response = await api.get<ApiResponse<Task>>(`/tasks/${id}`);
    return response.data.data;
  },

  async create(input: TaskInput): Promise<Task> {
    const response = await api.post<ApiResponse<Task>>('/tasks', input);
    return response.data.data;
  },

  async update(id: string, input: TaskInput): Promise<Task> {
    const response = await api.patch<ApiResponse<Task>>(`/tasks/${id}`, input);
    return response.data.data;
  },

  async updateStatus(id: string, status: TaskStatus): Promise<Task> {
    const response = await api.patch<ApiResponse<Task>>(`/tasks/${id}/status`, { status });
    return response.data.data;
  },

  async updatePriority(id: string, priority: TaskPriority): Promise<Task> {
    const response = await api.patch<ApiResponse<Task>>(`/tasks/${id}`, { priority });
    return response.data.data;
  },

  async addChecklistItem(taskId: string, title: string): Promise<Task> {
    const response = await api.post<ApiResponse<Task>>(`/tasks/${taskId}/checklist`, { title });
    return response.data.data;
  },

  async updateChecklistItem(
    taskId: string,
    itemId: string,
    changes: { title?: string; isCompleted?: boolean },
  ): Promise<Task> {
    const response = await api.patch<ApiResponse<Task>>(
      `/tasks/${taskId}/checklist/${itemId}`,
      changes,
    );
    return response.data.data;
  },

  async deleteChecklistItem(taskId: string, itemId: string): Promise<Task> {
    const response = await api.delete<ApiResponse<Task>>(
      `/tasks/${taskId}/checklist/${itemId}`,
    );
    return response.data.data;
  },

  async remove(id: string): Promise<void> {
    await api.delete(`/tasks/${id}`);
  },
};
