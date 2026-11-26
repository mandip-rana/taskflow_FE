import { useState, type FormEvent } from 'react';
import { LoaderCircle } from 'lucide-react';
import { Modal } from '../../../components/common/Modal';
import { TaskChecklistEditor } from './TaskChecklistEditor';
import { TaskChecklistDraftEditor, type ChecklistDraftItem } from './TaskChecklistDraftEditor';
import type { Task, TaskInput, TaskStatus } from '../types/task';
import { priorityLabels, statusLabels, taskPriorities, taskStatuses } from '../types/task';

interface TaskFormModalProps {
  task: Task | null;
  initialStatus?: TaskStatus;
  onClose: () => void;
  onSubmit: (input: TaskInput) => Promise<void>;
  onError: (message: string) => void;
  onChecklistUpdated: () => void;
}

export function TaskFormModal({
  task,
  initialStatus = 'todo',
  onClose,
  onSubmit,
  onError,
  onChecklistUpdated,
}: TaskFormModalProps) {
  const [title, setTitle] = useState(task?.title ?? '');
  const [description, setDescription] = useState(task?.description ?? '');
  const [status, setStatus] = useState<TaskStatus>(task?.status ?? initialStatus);
  const [priority, setPriority] = useState<TaskInput['priority']>(task?.priority ?? 'medium');
  const [dueDate, setDueDate] = useState(task?.dueDate?.slice(0, 10) ?? '');
  const [checklistDraftItems, setChecklistDraftItems] = useState<ChecklistDraftItem[]>([]);
  const [saving, setSaving] = useState(false);
  const [titleError, setTitleError] = useState('');
  const [checklistError, setChecklistError] = useState('');

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const cleanTitle = title.trim();
    if (!cleanTitle) {
      setTitleError('Give your task a title to continue.');
      return;
    }
    if (!task && checklistDraftItems.some((item) => !item.title.trim())) {
      setChecklistError('Checklist item titles cannot be empty.');
      return;
    }

    setSaving(true);
    setTitleError('');
    setChecklistError('');
    try {
      const input: TaskInput = {
        title: cleanTitle,
        description: description.trim(),
        status,
        priority,
        dueDate: dueDate || null,
      };
      if (!task && checklistDraftItems.length) {
        input.checklistItems = checklistDraftItems.map(({ title: itemTitle, isCompleted }) => ({
          title: itemTitle.trim(),
          isCompleted,
        }));
      }
      await onSubmit(input);
      onClose();
    } catch (error) {
      onError(error instanceof Error ? error.message : 'Your task could not be saved. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal title={task ? 'Edit task' : 'Create a task'} eyebrow={task ? 'UPDATE YOUR WORK' : 'ADD TO YOUR BOARD'} onClose={onClose}>
      <form className="task-form" onSubmit={handleSubmit}>
        <label className="field-label" htmlFor="task-title">Task name <span className="required-mark">*</span></label>
        <input
          id="task-title"
          className={`form-control ${titleError ? 'form-control-error' : ''}`}
          value={title}
          onChange={(event) => { setTitle(event.target.value); setTitleError(''); }}
          placeholder="e.g. Prepare project proposal"
          maxLength={200}
          required
          autoFocus
        />
        {titleError && <span className="field-error">{titleError}</span>}
        <label className="field-label field-label-spaced" htmlFor="task-description">Description <span className="field-optional">Optional</span></label>
        <textarea
          id="task-description"
          className="form-control form-textarea"
          value={description}
          onChange={(event) => setDescription(event.target.value)}
          placeholder="Add a few details to help you get started..."
          maxLength={2000}
          rows={3}
        />
        <div className="form-row">
          <div className="form-field">
            <label className="field-label" htmlFor="task-status">Status</label>
            <select id="task-status" className="form-control form-select" value={status} onChange={(event) => setStatus(event.target.value as TaskStatus)}>
              {taskStatuses.map((option) => <option value={option} key={option}>{statusLabels[option]}</option>)}
            </select>
          </div>
          <div className="form-field">
            <label className="field-label" htmlFor="task-priority">Priority</label>
            <select id="task-priority" className="form-control form-select" value={priority} onChange={(event) => setPriority(event.target.value as TaskInput['priority'])}>
              {taskPriorities.map((option) => <option value={option} key={option}>{priorityLabels[option]}</option>)}
            </select>
          </div>
        </div>
        <label className="field-label field-label-spaced" htmlFor="task-due-date">Due date <span className="field-optional">Optional</span></label>
        <input id="task-due-date" className="form-control date-control" type="date" value={dueDate} onChange={(event) => setDueDate(event.target.value)} />
        {task
          ? <TaskChecklistEditor task={task} disabled={saving} onUpdated={onChecklistUpdated} />
          : <>
              <TaskChecklistDraftEditor items={checklistDraftItems} onChange={setChecklistDraftItems} disabled={saving} />
              {checklistError && <span className="field-error" role="alert">{checklistError}</span>}
            </>}
        <footer className="form-footer">
          <button className="button button-secondary" type="button" onClick={onClose} disabled={saving}>Cancel</button>
          <button className="button button-primary" type="submit" disabled={saving}>
            {saving && <LoaderCircle className="spin" size={16} />}
            {saving ? 'Saving...' : task ? 'Save changes' : 'Create task'}
          </button>
        </footer>
      </form>
    </Modal>
  );
}
