import { useEffect, useState, type KeyboardEvent } from 'react';
import { Check, CheckSquare, LoaderCircle, Plus, Trash2 } from 'lucide-react';
import { getErrorMessage } from '../hooks/useTasks';
import { tasksApi } from '../services/tasksApi';
import type { Task, TaskChecklistItem } from '../types/task';

interface TaskChecklistEditorProps {
  task: Task;
  disabled: boolean;
  onUpdated: () => void;
}

export function TaskChecklistEditor({ task, disabled, onUpdated }: TaskChecklistEditorProps) {
  const [items, setItems] = useState(task.checklistItems ?? []);
  const [titleDrafts, setTitleDrafts] = useState<Record<string, string>>({});
  const [newItemTitle, setNewItemTitle] = useState('');
  const [busyItemId, setBusyItemId] = useState<string | null>(null);
  const [addingItem, setAddingItem] = useState(false);
  const [feedback, setFeedback] = useState<{ message: string; tone: 'success' | 'error' } | null>(null);

  useEffect(() => {
    const checklistItems = task.checklistItems ?? [];
    setItems(checklistItems);
    setTitleDrafts(Object.fromEntries(checklistItems.map((item) => [item.id, item.title])));
  }, [task.id, task.checklistItems]);

  const applyUpdatedTask = (updatedTask: Task) => {
    const updatedItems = updatedTask.checklistItems ?? [];
    setItems(updatedItems);
    setTitleDrafts(Object.fromEntries(updatedItems.map((item) => [item.id, item.title])));
    onUpdated();
  };

  const addItem = async () => {
    const title = newItemTitle.trim();
    if (!title) {
      setFeedback({ message: 'Enter a checklist item before adding it.', tone: 'error' });
      return;
    }

    setAddingItem(true);
    setFeedback(null);
    try {
      applyUpdatedTask(await tasksApi.addChecklistItem(task.id, title));
      setNewItemTitle('');
      setFeedback({ message: 'Checklist item added.', tone: 'success' });
    } catch (error) {
      setFeedback({ message: getErrorMessage(error), tone: 'error' });
    } finally {
      setAddingItem(false);
    }
  };

  const toggleItem = async (item: TaskChecklistItem) => {
    setBusyItemId(item.id);
    setFeedback(null);
    try {
      applyUpdatedTask(await tasksApi.updateChecklistItem(task.id, item.id, {
        isCompleted: !item.isCompleted,
      }));
    } catch (error) {
      setFeedback({ message: getErrorMessage(error), tone: 'error' });
    } finally {
      setBusyItemId(null);
    }
  };

  const saveTitle = async (item: TaskChecklistItem) => {
    const title = (titleDrafts[item.id] ?? item.title).trim();
    if (!title) {
      setTitleDrafts((drafts) => ({ ...drafts, [item.id]: item.title }));
      setFeedback({ message: 'Checklist item titles cannot be empty.', tone: 'error' });
      return;
    }
    if (title === item.title) return;

    setBusyItemId(item.id);
    setFeedback(null);
    try {
      applyUpdatedTask(await tasksApi.updateChecklistItem(task.id, item.id, { title }));
      setFeedback({ message: 'Checklist item updated.', tone: 'success' });
    } catch (error) {
      setTitleDrafts((drafts) => ({ ...drafts, [item.id]: item.title }));
      setFeedback({ message: getErrorMessage(error), tone: 'error' });
    } finally {
      setBusyItemId(null);
    }
  };

  const deleteItem = async (item: TaskChecklistItem) => {
    setBusyItemId(item.id);
    setFeedback(null);
    try {
      applyUpdatedTask(await tasksApi.deleteChecklistItem(task.id, item.id));
      setFeedback({ message: 'Checklist item removed.', tone: 'success' });
    } catch (error) {
      setFeedback({ message: getErrorMessage(error), tone: 'error' });
    } finally {
      setBusyItemId(null);
    }
  };

  const handleItemKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      event.currentTarget.blur();
    }
  };

  const handleNewItemKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      void addItem();
    }
  };

  const completedCount = items.filter((item) => item.isCompleted).length;
  const progress = items.length ? Math.round((completedCount / items.length) * 100) : 0;
  const busy = disabled || busyItemId !== null || addingItem;

  return (
    <section className="checklist-panel" aria-label="Task checklist">
      <header className="checklist-header">
        <div className="checklist-heading">
          <div className="checklist-icon"><CheckSquare size={17} /></div>
          <div>
            <h4>Checklist</h4>
            <p>{items.length ? `${completedCount} of ${items.length} completed` : 'Break this task into smaller steps'}</p>
          </div>
        </div>
        {items.length > 0 && <span className="checklist-count">{completedCount}/{items.length}</span>}
      </header>
      {items.length > 0 && (
        <div className="checklist-progress" aria-label={`${progress}% complete`}>
          <span style={{ width: `${progress}%` }} />
        </div>
      )}
      <div className="checklist-items">
        {items.map((item) => {
          const itemBusy = busyItemId === item.id;
          return (
            <div className={`checklist-item ${item.isCompleted ? 'checklist-item-complete' : ''}`} key={item.id}>
              <input
                className="checklist-checkbox"
                type="checkbox"
                checked={item.isCompleted}
                disabled={busy}
                aria-label={`Mark ${item.title} ${item.isCompleted ? 'incomplete' : 'complete'}`}
                onChange={() => toggleItem(item)}
              />
              <input
                className="checklist-title-input"
                type="text"
                value={titleDrafts[item.id] ?? item.title}
                disabled={busy}
                aria-label={`Checklist item title: ${item.title}`}
                maxLength={200}
                onChange={(event) => setTitleDrafts((drafts) => ({ ...drafts, [item.id]: event.target.value }))}
                onBlur={() => saveTitle(item)}
                onKeyDown={handleItemKeyDown}
              />
              <button
                className="checklist-delete"
                type="button"
                disabled={busy}
                aria-label={`Remove checklist item: ${item.title}`}
                onClick={() => deleteItem(item)}
              >
                {itemBusy ? <LoaderCircle className="spin" size={15} /> : <Trash2 size={15} />}
              </button>
            </div>
          );
        })}
        {!items.length && <p className="checklist-empty">No checklist items yet.</p>}
      </div>
      <div className="checklist-add-form">
        <input
          type="text"
          value={newItemTitle}
          maxLength={200}
          placeholder="Add a checklist item..."
          aria-label="New checklist item"
          disabled={busy}
          onChange={(event) => setNewItemTitle(event.target.value)}
          onKeyDown={handleNewItemKeyDown}
        />
        <button type="button" className="checklist-add-button" disabled={busy || !newItemTitle.trim()} onClick={() => void addItem()}>
          {addingItem ? <LoaderCircle className="spin" size={16} /> : <Plus size={16} />}
          <span>Add</span>
        </button>
      </div>
      {feedback && (
        <p className={`checklist-feedback checklist-feedback-${feedback.tone}`} role={feedback.tone === 'error' ? 'alert' : 'status'}>
          {feedback.tone === 'success' && <Check size={14} />}
          {feedback.message}
        </p>
      )}
    </section>
  );
}
