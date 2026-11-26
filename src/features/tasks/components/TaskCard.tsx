import type { DragEvent, KeyboardEvent } from 'react';
import { CalendarDays, CheckSquare, ChevronDown, Clock3, Flag } from 'lucide-react';
import type { Task, TaskPriority } from '../types/task';
import { priorityLabels, taskPriorities } from '../types/task';

interface TaskCardProps {
  task: Task;
  isDragging: boolean;
  isSourceHidden: boolean;
  onSelect: (task: Task) => void;
  onPriorityChange: (task: Task, priority: TaskPriority) => void;
  onDragStart: (task: Task, event: DragEvent<HTMLElement>) => void;
  onDragEnd: () => void;
}

const formatDate = (value: string) =>
  new Intl.DateTimeFormat('en', { month: 'short', day: 'numeric', year: 'numeric' })
    .format(new Date(`${value.slice(0, 10)}T00:00:00`));

export function TaskCard({
  task,
  isDragging,
  isSourceHidden,
  onSelect,
  onPriorityChange,
  onDragStart,
  onDragEnd,
}: TaskCardProps) {
  const checklistItems = task.checklistItems ?? [];
  const checklistCompleted = checklistItems.filter((item) => item.isCompleted).length;
  const checklistSummary = task.checklistSummary ?? {
    total: checklistItems.length,
    completed: checklistCompleted,
    pending: checklistItems.length - checklistCompleted,
  };
  const isOverdue = task.dueDate
    && task.status !== 'completed'
    && task.status !== 'cancelled'
    && new Date(`${task.dueDate.slice(0, 10)}T23:59:59`) < new Date();
  const taskCode = task.taskCode
    ?? (task.taskNumber ? `TK-${String(task.taskNumber).padStart(6, '0')}` : null);

  return (
    <article
      className={`task-card ${isDragging ? 'task-card-dragging' : ''} ${isSourceHidden ? 'task-card-source-hidden' : ''}`}
      role="button"
      tabIndex={0}
      aria-label={`Open task: ${task.title}`}
      draggable
      onClick={(event) => {
        if (event.target instanceof Element && event.target.closest('.priority-select-wrap')) return;
        onSelect(task);
      }}
      onKeyDown={(event: KeyboardEvent<HTMLElement>) => {
        if (event.target !== event.currentTarget) return;
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          onSelect(task);
        }
      }}
      onDragStart={(event) => {
        if (event.target instanceof Element && event.target.closest('.priority-select-wrap')) {
          event.preventDefault();
          return;
        }
        event.currentTarget.style.opacity = '0.83';
        const bounds = event.currentTarget.getBoundingClientRect();
        event.dataTransfer.setDragImage(
          event.currentTarget,
          event.clientX - bounds.left,
          event.clientY - bounds.top,
        );
        onDragStart(task, event);
      }}
      onDragEnd={(event) => {
        event.currentTarget.style.opacity = '';
        onDragEnd();
      }}
    >
      <div className="task-card-top">
        {taskCode && <span className="task-id">#{taskCode}</span>}
        <span className={`priority-badge priority-${task.priority}`} title={`${priorityLabels[task.priority]} priority`}>
          <Flag className="priority-flag" size={14} fill="currentColor" aria-hidden="true" />
          <span className="task-priority-label">{priorityLabels[task.priority]}</span>
        </span>
      </div>
      <h4 className="task-card-title">{task.title}</h4>
      {task.description
        ? <p className="task-description">{task.description}</p>
        : <p className="task-description task-description-empty">No description added.</p>}
      {checklistSummary.total > 0 && (
        <div
          className="task-checklist-summary"
          title={`Checklist: ${checklistSummary.completed} of ${checklistSummary.total} completed`}
        >
          <CheckSquare size={14} />
          <span>{checklistSummary.completed} / {checklistSummary.total}</span>
        </div>
      )}
      <div className="task-card-bottom">
        {task.dueDate
          ? <span className={`due-date ${isOverdue ? 'due-date-overdue' : ''}`}>
              {isOverdue ? <Clock3 size={14} /> : <CalendarDays size={14} />}
              {isOverdue ? 'Overdue · ' : ''}{formatDate(task.dueDate)}
            </span>
          : <span className="due-date due-date-none">No due date</span>}
        <label className="priority-select-wrap">
          <span className="sr-only">Change priority for {task.title}</span>
          <select
            className="card-priority-select"
            value={task.priority}
            onChange={(event) => onPriorityChange(task, event.target.value as TaskPriority)}
            aria-label={`Priority: ${priorityLabels[task.priority]}`}
          >
            {taskPriorities.map((priority) => (
              <option value={priority} key={priority}>{priorityLabels[priority]}</option>
            ))}
          </select>
          <ChevronDown size={13} aria-hidden="true" />
        </label>
      </div>
    </article>
  );
}
