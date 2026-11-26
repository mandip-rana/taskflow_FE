import type { LucideIcon } from 'lucide-react';

interface StatCardProps {
  label: string;
  value: string | number;
  note: string;
  icon: LucideIcon;
  tone: 'violet' | 'blue' | 'amber' | 'green';
}

export function StatCard({ label, value, note, icon: Icon, tone }: StatCardProps) {
  return (
    <article className="stat-card">
      <div className={`stat-icon stat-icon-${tone}`}><Icon size={19} strokeWidth={2} /></div>
      <div className="stat-copy">
        <div className="stat-label">{label}</div>
        <div className="stat-value">{value}</div>
        <div className="stat-note">{note}</div>
      </div>
    </article>
  );
}
