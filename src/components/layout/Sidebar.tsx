import { CheckCircle2, ListTodo, X } from 'lucide-react';
import type { TaskStatus } from '../../features/tasks/types/task';

interface SidebarProps {
  onNavigate: (status: TaskStatus | '') => void;
  open: boolean;
  onClose: () => void;
}

export function Sidebar({ onNavigate, open, onClose }: SidebarProps) {
  return (
    <>
      {open && <button className="sidebar-backdrop" aria-label="Close navigation" onClick={onClose} />}
      <aside className={`sidebar ${open ? 'sidebar-open' : ''}`}>
        <div className="brand-lockup">
          <div className="brand-mark"><CheckCircle2 size={21} strokeWidth={2.5} /></div>
          <div>
            <div className="brand-name">TaskFlow</div>
          </div>
          <button className="icon-button sidebar-close" aria-label="Close navigation" onClick={onClose}><X size={19} /></button>
        </div>
        <div className="sidebar-label">WORKSPACE</div>
        <nav className="sidebar-nav" aria-label="Main navigation">
          <button
            className="nav-item nav-item-active"
            onClick={() => { onNavigate(''); onClose(); }}
            aria-current="page"
          >
            <ListTodo size={18} strokeWidth={1.9} />
            <span>Task Management</span>
          </button>
        </nav>
        <div className="sidebar-bottom">
  <div className="sidebar-footer">
    © {new Date().getFullYear()} TaskFlow. All rights reserved.
  </div>
</div>
      </aside>
    </>
  );
}
