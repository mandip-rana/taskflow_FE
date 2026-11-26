import { useRef, useState, type DragEvent } from 'react';
import { Circle, CircleCheck, CircleDashed, CircleX, Plus } from 'lucide-react';
import type { Task, TaskPriority, TaskStatus } from '../types/task';
import { statusLabels, taskStatuses } from '../types/task';
import { TaskCard } from './TaskCard';

const columnIcons = {
  todo: Circle,
  in_progress: CircleDashed,
  completed: CircleCheck,
  cancelled: CircleX,
};

interface TaskBoardProps {
  tasks: Task[];
  loading: boolean;
  onCreate: (status?: TaskStatus) => void;
  onSelect: (task: Task) => void;
  onStatusChange: (task: Task, status: TaskStatus) => Promise<void>;
  onPriorityChange: (task: Task, priority: TaskPriority) => void;
}

export function TaskBoard({
  tasks,
  loading,
  onCreate,
  onSelect,
  onStatusChange,
  onPriorityChange,
}: TaskBoardProps) {
  const [draggedTaskId, setDraggedTaskId] = useState<string | null>(null);
  const [dropTargetStatus, setDropTargetStatus] = useState<TaskStatus | null>(null);
  const dropPendingRef = useRef(false);
  const draggedTask = tasks.find((task) => task.id === draggedTaskId);

  const handleDragStart = (task: Task, event: DragEvent<HTMLElement>) => {
    event.dataTransfer.effectAllowed = 'move';
    event.dataTransfer.setData('text/plain', task.id);
    setDraggedTaskId(task.id);
  };

  const handleDragEnd = () => {
    if (dropPendingRef.current) return;
    setDraggedTaskId(null);
    setDropTargetStatus(null);
  };

  const handleDrop = async (status: TaskStatus, event: DragEvent<HTMLElement>) => {
    event.preventDefault();
    const taskId = event.dataTransfer.getData('text/plain');
    const draggedTask = tasks.find((task) => task.id === taskId);
    if (!draggedTask || draggedTask.status === status) {
      handleDragEnd();
      return;
    }

    dropPendingRef.current = true;
    try {
      await onStatusChange(draggedTask, status);
    } finally {
      dropPendingRef.current = false;
      setDraggedTaskId(null);
      setDropTargetStatus(null);
    }
  };

  return (
    <div className="board-grid">
      {taskStatuses.map((status) => {
        const Icon = columnIcons[status];
        const columnTasks = tasks.filter((task) => task.status === status);
        const isDropTarget = dropTargetStatus === status && draggedTaskId !== null;
        const showDropPreview = isDropTarget && draggedTask?.status !== status;
        const isDraggingOut = draggedTask?.status === status && dropTargetStatus !== null && dropTargetStatus !== status;
        const displayCount = columnTasks.length - Number(isDraggingOut) + Number(showDropPreview);
        return (
          <section
            className={`board-column column-${status} ${isDropTarget ? 'board-column-drop-target' : ''}`}
            key={status}
            aria-label={`${statusLabels[status]} tasks`}
            onDragEnter={(event) => {
              event.preventDefault();
              if (draggedTaskId) setDropTargetStatus(status);
            }}
            onDragOver={(event) => {
              event.preventDefault();
              event.dataTransfer.dropEffect = 'move';
              if (draggedTaskId) setDropTargetStatus(status);
            }}
            onDragLeave={(event) => {
              if (!event.currentTarget.contains(event.relatedTarget as Node | null)) {
                setDropTargetStatus(null);
              }
            }}
            onDrop={(event) => handleDrop(status, event)}
          >
            <header className="column-header">
              <div className="column-title-wrap">
                <Icon className="column-icon" size={17} />
                <h3>{statusLabels[status]}</h3>
                <span className="column-count">{displayCount}</span>
              </div>
              <button className="column-add" type="button" aria-label={`Add task to ${statusLabels[status]}`} onClick={() => onCreate(status)}><Plus size={17} /></button>
            </header>
            <div className="column-content">
              {loading ? (
                <div className="task-skeletons" aria-label="Loading tasks">
                  <div className="task-skeleton" /><div className="task-skeleton task-skeleton-short" />
                </div>
              ) : (
                <>
                  {showDropPreview && draggedTask && (
                    <div className="task-drop-preview" aria-hidden="true">
                      <span className="task-drop-preview-status">{statusLabels[status]}</span>
                      <strong>{draggedTask.title}</strong>
                      <span>{draggedTask.description || 'No description added.'}</span>
                    </div>
                  )}
                  {columnTasks.map((task) => (
                    <TaskCard
                      key={task.id}
                      task={task}
                      isDragging={draggedTaskId === task.id}
                      isSourceHidden={
                        task.id === draggedTaskId
                        && dropTargetStatus !== null
                        && dropTargetStatus !== task.status
                      }
                      onSelect={onSelect}
                      onPriorityChange={onPriorityChange}
                      onDragStart={handleDragStart}
                      onDragEnd={handleDragEnd}
                    />
                  ))}
                </>
              )}
              {!loading && !columnTasks.length && !showDropPreview && (
                <div className="column-empty">
                  <div className="empty-icon"><Icon size={19} /></div>
                  <span>{tasks.length ? 'No tasks here' : 'Nothing on your board yet'}</span>
                  {!tasks.length && <button type="button" onClick={() => onCreate(status)}>Add a task</button>}
                </div>
              )}
            </div>
          </section>
        );
      })}
    </div>
  );
}
