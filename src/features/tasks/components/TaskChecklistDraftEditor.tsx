import { useRef, useState, type KeyboardEvent } from 'react';
import { CheckSquare, Plus, Trash2 } from 'lucide-react';

export interface ChecklistDraftItem {
  id: string;
  title: string;
  isCompleted: boolean;
}

interface TaskChecklistDraftEditorProps {
  items: ChecklistDraftItem[];
  onChange: (items: ChecklistDraftItem[]) => void;
  disabled: boolean;
}

const MAX_CHECKLIST_ITEMS = 100;

export function TaskChecklistDraftEditor({ items, onChange, disabled }: TaskChecklistDraftEditorProps) {
  const [newItemTitle, setNewItemTitle] = useState('');
  const nextId = useRef(0);
  const completedCount = items.filter((item) => item.isCompleted).length;
  const progress = items.length ? Math.round((completedCount / items.length) * 100) : 0;

  const addItem = () => {
    const title = newItemTitle.trim();
    if (!title || items.length >= MAX_CHECKLIST_ITEMS) return;
    nextId.current += 1;
    onChange([...items, { id: String(nextId.current), title, isCompleted: false }]);
    setNewItemTitle('');
  };

  const updateItem = (id: string, changes: Partial<ChecklistDraftItem>) => {
    onChange(items.map((item) => item.id === id ? { ...item, ...changes } : item));
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
      addItem();
    }
  };

  return (
    <section className="checklist-panel checklist-draft-panel" aria-label="Task checklist">
      <header className="checklist-header">
        <div className="checklist-heading">
          <div className="checklist-icon"><CheckSquare size={17} /></div>
          <div>
            <h4>Checklist</h4>
            <p>{items.length ? `${completedCount} of ${items.length} completed` : 'Add steps to complete this task'}</p>
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
        {items.map((item) => (
          <div className={`checklist-item ${item.isCompleted ? 'checklist-item-complete' : ''}`} key={item.id}>
            <input
              className="checklist-checkbox"
              type="checkbox"
              checked={item.isCompleted}
              disabled={disabled}
              aria-label={`Mark ${item.title} ${item.isCompleted ? 'incomplete' : 'complete'}`}
              onChange={(event) => updateItem(item.id, { isCompleted: event.target.checked })}
            />
            <input
              className="checklist-title-input"
              type="text"
              value={item.title}
              maxLength={200}
              disabled={disabled}
              aria-label={`Checklist item title: ${item.title}`}
              onChange={(event) => updateItem(item.id, { title: event.target.value })}
              onKeyDown={handleItemKeyDown}
            />
            <button
              className="checklist-delete"
              type="button"
              aria-label={`Remove checklist item: ${item.title}`}
              disabled={disabled}
              onClick={() => onChange(items.filter((draft) => draft.id !== item.id))}
            >
              <Trash2 size={15} />
            </button>
          </div>
        ))}
        {!items.length && <p className="checklist-empty">No checklist items yet.</p>}
      </div>
      <div className="checklist-add-form">
        <input
          type="text"
          value={newItemTitle}
          maxLength={200}
          placeholder={items.length >= MAX_CHECKLIST_ITEMS ? 'Checklist limit reached' : 'Add a checklist item...'}
          aria-label="New checklist item"
          disabled={disabled || items.length >= MAX_CHECKLIST_ITEMS}
          onChange={(event) => setNewItemTitle(event.target.value)}
          onKeyDown={handleNewItemKeyDown}
        />
        <button
          type="button"
          className="checklist-add-button"
          disabled={disabled || !newItemTitle.trim() || items.length >= MAX_CHECKLIST_ITEMS}
          onClick={addItem}
        >
          <Plus size={16} />
          <span>Add</span>
        </button>
      </div>
    </section>
  );
}
