import { useCallback, useEffect, useState } from 'react';
import { tasksApi } from '../services/tasksApi';
import type { Task, TaskFilters, TaskPriority, TaskStats, TaskStatus, TaskInput } from '../types/task';

export function useTasks(filters: TaskFilters, enabled = true) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [stats, setStats] = useState<TaskStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [debouncedSearch, setDebouncedSearch] = useState(filters.search);

  useEffect(() => {
    const timeout = window.setTimeout(() => setDebouncedSearch(filters.search), 300);
    return () => window.clearTimeout(timeout);
  }, [filters.search]);

  useEffect(() => {
    if (!enabled) {
      setTasks([]);
      setStats(null);
      setLoading(false);
      setError(null);
      return;
    }

    const controller = new AbortController();
    const requestFilters = { ...filters, search: debouncedSearch };

    setLoading(true);
    setError(null);
    Promise.all([
      tasksApi.list(requestFilters, controller.signal),
      tasksApi.getStats(
        { dateFrom: requestFilters.dateFrom, dateTo: requestFilters.dateTo },
        controller.signal,
      ),
    ])
      .then(([nextTasks, nextStats]) => {
        setTasks(nextTasks);
        setStats(nextStats);
      })
      .catch((cause: unknown) => {
        if (controller.signal.aborted) return;
        setError(getErrorMessage(cause));
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });

    return () => controller.abort();
  }, [
    debouncedSearch,
    filters.status,
    filters.priority,
    filters.sortBy,
    filters.order,
    filters.dateFrom,
    filters.dateTo,
    enabled,
    refreshKey,
  ]);

  const refresh = useCallback(() => setRefreshKey((key) => key + 1), []);

  const createTask = useCallback(async (input: TaskInput) => {
    await tasksApi.create(input);
    refresh();
  }, [refresh]);

  const editTask = useCallback(async (id: string, input: TaskInput) => {
    await tasksApi.update(id, input);
    refresh();
  }, [refresh]);

  const changeStatus = useCallback(async (id: string, status: TaskStatus) => {
    const updatedTask = await tasksApi.updateStatus(id, status);
    setTasks((current) => {
      const next = current.map((task) => (task.id === id ? updatedTask : task));
      return filters.status && filters.status !== status
        ? next.filter((task) => task.id !== id)
        : next;
    });
    refresh();
  }, [filters.status, refresh]);

  const changePriority = useCallback(async (id: string, priority: TaskPriority) => {
    await tasksApi.updatePriority(id, priority);
    refresh();
  }, [refresh]);

  const deleteTask = useCallback(async (id: string) => {
    await tasksApi.remove(id);
    refresh();
  }, [refresh]);

  const reload = useCallback(() => setRefreshKey((key) => key + 1), []);

  return {
    tasks,
    stats,
    loading,
    error,
    reload,
    createTask,
    editTask,
    changeStatus,
    changePriority,
    deleteTask,
  };
}

export function getErrorMessage(error: unknown): string {
  if (typeof error === 'object' && error !== null && 'response' in error) {
    const response = error.response;
    if (typeof response === 'object' && response !== null && 'data' in response) {
      const data = response.data;
      if (typeof data === 'object' && data !== null && 'message' in data && typeof data.message === 'string') {
        return data.message;
      }
    }
  }
  if (error instanceof Error) return error.message;
  return 'Something went wrong. Please try again.';
}
