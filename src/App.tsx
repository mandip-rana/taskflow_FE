import { useEffect, useState } from 'react';
import { AlertCircle, ArrowDownUp, Check, CircleCheck, ClipboardList, Clock3, ListTodo, Menu, Plus, Search, X } from 'lucide-react';
import { Sidebar } from './components/layout/Sidebar';
import { TaskBoard } from './features/tasks/components/TaskBoard';
import { TaskDetailsModal } from './features/tasks/components/TaskDetailsModal';
import { TaskFormModal } from './features/tasks/components/TaskFormModal';
import { StatCard } from './features/tasks/components/StatCard';
import { useTasks, getErrorMessage } from './features/tasks/hooks/useTasks';
import { priorityLabels } from './features/tasks/types/task';
import type { Task, TaskFilters, TaskInput, TaskPriority, TaskStatus } from './features/tasks/types/task';

type ReportingPeriod = 'overall' | 'thisMonth' | 'thisYear' | 'custom';

const dateToInputValue = (date: Date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const formatPeriodDate = (value: string) =>
  new Intl.DateTimeFormat('en', { month: 'short', day: 'numeric', year: 'numeric' })
    .format(new Date(`${value}T00:00:00`));

function App() {
  const [filters, setFilters] = useState<TaskFilters>({
    search: '',
    status: '',
    priority: '',
    sortBy: 'createdAt',
    order: 'desc',
  });
  const [reportingPeriod, setReportingPeriod] = useState<ReportingPeriod>('thisYear');
  const [customDateFrom, setCustomDateFrom] = useState('');
  const [customDateTo, setCustomDateTo] = useState('');
  const today = new Date();
  const todayValue = dateToInputValue(today);
  const periodStart = reportingPeriod === 'thisYear'
    ? `${today.getFullYear()}-01-01`
    : reportingPeriod === 'thisMonth'
      ? `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-01`
      : '';
  const dateFrom = reportingPeriod === 'custom' ? customDateFrom : periodStart;
  const dateTo = reportingPeriod === 'custom'
    ? customDateTo
    : reportingPeriod === 'overall' ? '' : todayValue;
  const dateRangeError = reportingPeriod === 'custom'
    ? !customDateFrom || !customDateTo
      ? 'Select both a start date and an end date to view this range.'
      : customDateFrom > customDateTo
        ? 'The start date must be on or before the end date.'
        : null
    : null;
  const reportFilters: TaskFilters = {
    ...filters,
    dateFrom: dateFrom || undefined,
    dateTo: dateTo || undefined,
  };
  const {
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
  } =
    useTasks(reportFilters, !dateRangeError);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [formTask, setFormTask] = useState<Task | null | undefined>(undefined);
  const [createStatus, setCreateStatus] = useState<TaskStatus>('todo');
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [pendingDelete, setPendingDelete] = useState<Task | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [toast, setToast] = useState<{ message: string; tone: 'success' | 'error' } | null>(null);

  useEffect(() => {
    if (!toast) return;
    const timeout = window.setTimeout(() => setToast(null), 3600);
    return () => window.clearTimeout(timeout);
  }, [toast]);

  const showToast = (message: string, tone: 'success' | 'error') => {
    setToast({ message, tone });
  };

  const openCreate = (status: TaskStatus = 'todo') => {
    setCreateStatus(status);
    setFormTask(null);
  };

  const handleSaveTask = async (input: TaskInput) => {
    try {
      if (formTask) {
        await editTask(formTask.id, input);
        showToast('Your task has been updated.', 'success');
      } else {
        await createTask(input);
        showToast('Your task has been added to the board.', 'success');
      }
    } catch (cause) {
      const message = getErrorMessage(cause);
      throw new Error(message);
    }
  };

  const handleStatusChange = async (task: Task, status: TaskStatus) => {
    try {
      await changeStatus(task.id, status);
      showToast(`Moved to ${status.replace('_', ' ')}.`, 'success');
    } catch (cause) {
      showToast(getErrorMessage(cause), 'error');
    }
  };

  const handlePriorityChange = async (task: Task, priority: TaskPriority) => {
    try {
      await changePriority(task.id, priority);
      showToast(`Priority changed to ${priorityLabels[priority]}.`, 'success');
    } catch (cause) {
      showToast(getErrorMessage(cause), 'error');
    }
  };

  const confirmDelete = async () => {
    if (!pendingDelete) return;
    setDeleting(true);
    try {
      await deleteTask(pendingDelete.id);
      showToast('Task deleted.', 'success');
      setPendingDelete(null);
      setSelectedTask(null);
    } catch (cause) {
      showToast(getErrorMessage(cause), 'error');
    } finally {
      setDeleting(false);
    }
  };

  const openEdit = (task: Task) => {
    setSelectedTask(null);
    setFormTask(task);
  };

  const sortValue = `${filters.sortBy}-${filters.order}`;
  const updateSort = (value: string) => {
    const [sortBy, order] = value.split('-') as [TaskFilters['sortBy'], TaskFilters['order']];
    setFilters((current) => ({ ...current, sortBy, order }));
  };
  const periodDescription = reportingPeriod === 'overall'
    ? 'Showing tasks created at any time.'
    : dateRangeError
      ? 'Choose a valid date range to view tasks.'
      : `Tasks created ${formatPeriodDate(dateFrom)} – ${formatPeriodDate(dateTo)}.`;
  const metricValue = (value: number | undefined) =>
    loading || dateRangeError || (error && !stats) ? '—' : value ?? 0;

  return (
    <div className="app-shell">
      <Sidebar
        onNavigate={(status) => setFilters((current) => ({ ...current, status }))}
        open={mobileNavOpen}
        onClose={() => setMobileNavOpen(false)}
      />
      <main className="main-panel">
        <header className="topbar">
          <div className="topbar-left">
            <button className="icon-button mobile-menu-button" type="button" aria-label="Open navigation" onClick={() => setMobileNavOpen(true)}><Menu size={21} /></button>
            <div className="topbar-title">Task Management</div>
          </div>
          <div className="topbar-right">
            <span className="today-label">{new Intl.DateTimeFormat('en', { weekday: 'short', month: 'short', day: 'numeric' }).format(new Date())}</span>
            <div className="avatar" aria-label="TaskFlow workspace">TF</div>
          </div>
        </header>

        <div className="page-content">
          <section className="reporting-bar" aria-label="Task reporting period">
            <div className="reporting-controls">
              <div className="period-tabs" role="group" aria-label="Select reporting period">
                {([
                  ['overall', 'Overall'],
                  ['thisMonth', 'This Month'],
                  ['thisYear', 'This Year'],
                  ['custom', 'Custom Date'],
                ] as const).map(([period, label]) => (
                  <button
                    className={`period-tab ${reportingPeriod === period ? 'period-tab-active' : ''}`}
                    type="button"
                    key={period}
                    aria-pressed={reportingPeriod === period}
                    onClick={() => setReportingPeriod(period)}
                  >
                    {label}
                  </button>
                ))}
              </div>
              <div className="period-date-range">
                <label className="period-date-field">
                  <span className="sr-only">Start date</span>
                  <input
                    type="date"
                    value={customDateFrom}
                    aria-label="Start date"
                    aria-invalid={Boolean(dateRangeError && reportingPeriod === 'custom')}
                    onFocus={() => setReportingPeriod('custom')}
                    onChange={(event) => {
                      setCustomDateFrom(event.target.value);
                      setReportingPeriod('custom');
                    }}
                  />
                </label>
                <span className="period-date-separator">to</span>
                <label className="period-date-field">
                  <span className="sr-only">End date</span>
                  <input
                    type="date"
                    value={customDateTo}
                    aria-label="End date"
                    aria-invalid={Boolean(dateRangeError && reportingPeriod === 'custom')}
                    onFocus={() => setReportingPeriod('custom')}
                    onChange={(event) => {
                      setCustomDateTo(event.target.value);
                      setReportingPeriod('custom');
                    }}
                  />
                </label>
              </div>
            </div>
            <button className="button button-primary create-button" type="button" onClick={() => openCreate()}>
              <Plus size={16} strokeWidth={2.2} /> Create task
            </button>
          </section>
          <p className={`period-description ${dateRangeError ? 'period-description-error' : ''}`} role={dateRangeError ? 'alert' : 'status'}>
            {dateRangeError ?? periodDescription}
          </p>

          <section className="stats-grid" aria-label="Task statistics">
            <StatCard label="All Tasks" value={metricValue(stats?.total)} note="Across this date range" icon={ListTodo} tone="violet" />
            <StatCard label="To-Do's" value={metricValue(stats?.byStatus.todo)} note="Waiting to be started" icon={ClipboardList} tone="blue" />
            <StatCard label="Pending Tasks" value={metricValue(stats?.byStatus.in_progress)} note="Currently in progress" icon={Clock3} tone="amber" />
            <StatCard label="Completed Tasks" value={metricValue(stats?.byStatus.completed)} note="Finished tasks" icon={CircleCheck} tone="green" />
          </section>

          <section className="tasks-section" id="task-board">
            <div className="section-heading">
              <div>
                <h2>Task board</h2>
                <p>Keep work moving across your four workflow stages.</p>
              </div>
              <div className="section-heading-actions">
                <div className="board-total"><span className="board-total-dot" />{tasks.length} {tasks.length === 1 ? 'task' : 'tasks'}</div>
              </div>
            </div>

            <div className="toolbar">
              <label className="toolbar-select-wrap">
                <span className="sr-only">Filter by priority</span>
                <select className="toolbar-select" value={filters.priority} onChange={(event) => setFilters((current) => ({ ...current, priority: event.target.value as TaskFilters['priority'] }))}>
                  <option value="">All priorities</option>
                  <option value="critical">Critical priority</option>
                  <option value="high">High priority</option>
                  <option value="medium">Medium priority</option>
                  <option value="low">Low priority</option>
                </select>
              </label>
              <label className="toolbar-select-wrap status-filter">
                <span className="sr-only">Filter by status</span>
                <select className="toolbar-select" value={filters.status} onChange={(event) => setFilters((current) => ({ ...current, status: event.target.value as TaskFilters['status'] }))}>
                  <option value="">All statuses</option>
                  <option value="todo">To Do</option>
                  <option value="in_progress">In Progress</option>
                  <option value="completed">Completed</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </label>
              <label className="toolbar-select-wrap sort-select-wrap">
                <span className="sort-icon"><ArrowDownUp size={15} /></span>
                <span className="sr-only">Sort tasks</span>
                <select className="toolbar-select sort-select" value={sortValue} onChange={(event) => updateSort(event.target.value)}>
                  <option value="createdAt-desc">Newest first</option>
                  <option value="createdAt-asc">Oldest first</option>
                  <option value="dueDate-asc">Due date (earliest)</option>
                  <option value="dueDate-desc">Due date (latest)</option>
                </select>
              </label>
              <label className="search-field">
                <Search size={17} />
                <span className="sr-only">Search tasks</span>
                <input
                  type="search"
                  placeholder="Search tasks..."
                  value={filters.search}
                  onChange={(event) => setFilters((current) => ({ ...current, search: event.target.value }))}
                  maxLength={100}
                />
                {filters.search && <button className="search-clear" type="button" aria-label="Clear search" onClick={() => setFilters((current) => ({ ...current, search: '' }))}><X size={15} /></button>}
              </label>
            </div>

            {error && (
              <div className="error-banner" role="alert">
                <AlertCircle size={18} />
                <div><strong>Couldn’t load your tasks</strong><span>{error}</span></div>
                <button className="button button-secondary retry-button" type="button" onClick={reload}>Try again</button>
              </div>
            )}

            {dateRangeError ? (
              <div className="date-range-empty">
                <Clock3 size={20} />
                <span>Choose a valid date range to load the task board.</span>
              </div>
            ) : (
              <TaskBoard
                tasks={tasks}
                loading={loading}
                onCreate={openCreate}
                onSelect={setSelectedTask}
                onStatusChange={handleStatusChange}
                onPriorityChange={handlePriorityChange}
              />
            )}
          </section>

        </div>
      </main>

      {formTask !== undefined && (
        <TaskFormModal
          task={formTask}
          initialStatus={createStatus}
          onClose={() => setFormTask(undefined)}
          onSubmit={handleSaveTask}
          onError={(message) => showToast(message, 'error')}
          onChecklistUpdated={reload}
        />
      )}
      {selectedTask && (
        <TaskDetailsModal
          task={selectedTask}
          onClose={() => setSelectedTask(null)}
          onEdit={openEdit}
          onDelete={setPendingDelete}
        />
      )}
      {pendingDelete && (
        <div className="modal-backdrop" onMouseDown={(event) => {
          if (event.target === event.currentTarget && !deleting) setPendingDelete(null);
        }}>
          <section className="modal-panel modal-small delete-dialog" role="alertdialog" aria-modal="true" aria-labelledby="delete-title" aria-describedby="delete-description">
            <div className="delete-icon"><AlertCircle size={21} /></div>
            <h2 id="delete-title">Delete this task?</h2>
            <p id="delete-description"><strong>{pendingDelete.title}</strong> will be permanently removed. This action can’t be undone.</p>
            <div className="delete-actions">
              <button className="button button-secondary" type="button" disabled={deleting} onClick={() => setPendingDelete(null)}>Keep task</button>
              <button className="button button-danger" type="button" disabled={deleting} onClick={confirmDelete}>{deleting ? 'Deleting...' : 'Delete task'}</button>
            </div>
          </section>
        </div>
      )}
      {toast && (
        <div className={`toast toast-${toast.tone}`} role={toast.tone === 'error' ? 'alert' : 'status'} aria-live="polite">
          {toast.tone === 'success' ? <Check size={17} /> : <AlertCircle size={17} />}
          <span>{toast.message}</span>
          <button type="button" className="toast-close" aria-label="Dismiss message" onClick={() => setToast(null)}><X size={16} /></button>
        </div>
      )}
    </div>
  );
}

export default App;
