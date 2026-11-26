import { CalendarDays, Check, CheckSquare, Pencil, Trash2 } from 'lucide-react';
import { Modal } from '../../../components/common/Modal';
import type { Task } from '../types/task';
import { priorityLabels, statusLabels } from '../types/task';

interface TaskDetailsModalProps {
  task: Task;
  onClose: () => void;
  onEdit: (task: Task) => void;
  onDelete: (task: Task) => void;
}

export function TaskDetailsModal({ task, onClose, onEdit, onDelete }: TaskDetailsModalProps) {
  const checklistItems = task.checklistItems ?? [];
  const completedCount = checklistItems.filter((item) => item.isCompleted).length;
  const checklistProgress = checklistItems.length
    ? Math.round((completedCount / checklistItems.length) * 100)
    : 0;

  return (
    <Modal title="Task details" eyebrow="YOUR WORKSPACE" onClose={onClose}>
      <div className="task-details">
        <div className="detail-badges">
          <span className={`priority-badge priority-${task.priority}`}><span className="priority-dot" />{priorityLabels[task.priority]} priority</span>
          <span className={`detail-status detail-status-${task.status}`}>{statusLabels[task.status]}</span>
        </div>
        <h3>{task.title}</h3>
        <p className={task.description ? 'detail-description' : 'detail-description detail-description-empty'}>
          {task.description || 'No description has been added to this task.'}
        </p>
        <div className="detail-meta">
          <div className="detail-meta-icon"><CalendarDays size={17} /></div>
          <div><span>Due date</span><strong>{task.dueDate
            ? new Intl.DateTimeFormat('en', { month: 'long', day: 'numeric', year: 'numeric' }).format(new Date(`${task.dueDate.slice(0, 10)}T00:00:00`))
            : 'No due date set'}</strong></div>
        </div>
        {checklistItems.length > 0 && (
            <section className="checklist-panel detail-checklist" aria-label="Task checklist">
              <header className="checklist-header">
                <div className="checklist-heading">
                  <div className="checklist-icon"><CheckSquare size={17} /></div>
                  <div>
                    <h4>Checklist</h4>
                    <p>{completedCount} of {checklistItems.length} completed</p>
                  </div>
                </div>
                <span className="checklist-count">{completedCount}/{checklistItems.length}</span>
              </header>
              <div
                className="checklist-progress"
                role="progressbar"
                aria-label="Checklist progress"
                aria-valuemin={0}
                aria-valuemax={100}
                aria-valuenow={checklistProgress}
              >
                <span style={{ width: `${checklistProgress}%` }} />
              </div>
              <ul className="detail-checklist-items">
                {checklistItems.map((item) => (
                  <li
                    className={`detail-checklist-item ${item.isCompleted ? 'detail-checklist-item-complete' : ''}`}
                    key={item.id}
                  >
                    <span className="detail-checklist-mark" aria-hidden="true">
                      {item.isCompleted && <Check size={12} strokeWidth={2.5} />}
                    </span>
                    <span className="detail-checklist-title">{item.title}</span>
                    <span className={`detail-checklist-status ${item.isCompleted ? 'detail-checklist-status-complete' : ''}`}>
                      {item.isCompleted ? 'Completed' : 'Incomplete'}
                    </span>
                  </li>
                ))}
              </ul>
            </section>
        )}
        <div className="detail-actions">
          <button className="button button-secondary button-danger-outline" type="button" onClick={() => onDelete(task)}><Trash2 size={16} /> Delete</button>
          <button className="button button-primary" type="button" onClick={() => onEdit(task)}><Pencil size={16} /> Edit task</button>
        </div>
      </div>
    </Modal>
  );
}
