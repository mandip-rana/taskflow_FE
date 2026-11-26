import { useEffect, type ReactNode } from 'react';
import { X } from 'lucide-react';

interface ModalProps {
  title: string;
  eyebrow?: string;
  onClose: () => void;
  children: ReactNode;
  size?: 'medium' | 'small';
}

export function Modal({ title, eyebrow, onClose, children, size = 'medium' }: ModalProps) {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  return (
    <div className="modal-backdrop" onMouseDown={(event) => {
      if (event.target === event.currentTarget) onClose();
    }}>
      <section className={`modal-panel modal-${size}`} role="dialog" aria-modal="true" aria-label={title}>
        <header className="modal-header">
          <div>
            {eyebrow && <div className="modal-eyebrow">{eyebrow}</div>}
            <h2>{title}</h2>
          </div>
          <button className="icon-button modal-close" type="button" aria-label="Close dialog" onClick={onClose}><X size={20} /></button>
        </header>
        {children}
      </section>
    </div>
  );
}
