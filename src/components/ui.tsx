import type { ReactNode } from 'react';
import { BookOpenText, CheckCircle2, CircleDashed, CircleDot, FileText, Globe, Images } from 'lucide-react';
import type { DocKind, Level } from '@/lib/content';
import { levelLabel } from '@/lib/content';
import type { Status } from '@/lib/store';

export const statusLabel: Record<Status, string> = {
  'not-started': 'Chưa học',
  learning: 'Đang học',
  completed: 'Đã học',
};

export function StatusIcon({ status, className = 'size-4' }: { status: Status; className?: string }) {
  if (status === 'completed') return <CheckCircle2 aria-label="Đã học" className={`${className} text-success`} />;
  if (status === 'learning') return <CircleDot aria-label="Đang học" className={`${className} text-accent`} />;
  return <CircleDashed aria-label="Chưa học" className={`${className} text-muted`} />;
}

export function StatusBadge({ status }: { status: Status }) {
  const tone =
    status === 'completed' ? 'bg-success-soft text-success' : status === 'learning' ? 'bg-accent-soft text-accent' : 'bg-sunk text-muted';
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-medium ${tone}`}>
      <StatusIcon status={status} className="size-3.5" />
      {statusLabel[status]}
    </span>
  );
}

export function LevelBadge({ level }: { level: Level }) {
  return <span className="rounded border border-line px-1.5 py-0.5 font-mono text-[0.68rem] uppercase tracking-wide text-muted">{levelLabel[level]}</span>;
}

export function KindIcon({ kind, className = 'size-4' }: { kind: DocKind; className?: string }) {
  const Icon = kind === 'gallery' ? Images : kind === 'pdf' ? FileText : kind === 'html' ? Globe : BookOpenText;
  return <Icon aria-hidden className={`${className} shrink-0`} />;
}

export function ProgressBar({ value, className = '' }: { value: number; className?: string }) {
  return (
    <div
      className={`h-1.5 overflow-hidden rounded-full bg-sunk ${className}`}
      role="progressbar"
      aria-valuenow={value}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      <div className="h-full rounded-full bg-accent transition-[width]" style={{ width: `${value}%` }} />
    </div>
  );
}

export function PageHeader({ eyebrow, title, children }: { eyebrow?: string; title: string; children?: ReactNode }) {
  return (
    <header className="flex flex-col gap-2 border-b border-line pb-6">
      {eyebrow && <div className="eyebrow">{eyebrow}</div>}
      <h1 className="font-display text-3xl font-bold tracking-tight">{title}</h1>
      {children && <div className="max-w-[65ch] text-ink-2">{children}</div>}
    </header>
  );
}

export function EmptyState({ icon, title, children }: { icon: ReactNode; title: string; children?: ReactNode }) {
  return (
    <div className="flex flex-col items-center gap-2 rounded-lg border border-dashed border-line px-6 py-12 text-center">
      <div className="text-muted">{icon}</div>
      <div className="font-display font-semibold">{title}</div>
      {children && <div className="max-w-[50ch] text-sm text-muted">{children}</div>}
    </div>
  );
}

export function formatDate(ts: number) {
  return new Date(ts).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

export function timeAgo(ts: number) {
  const m = Math.round((Date.now() - ts) / 60000);
  if (m < 1) return 'vừa xong';
  if (m < 60) return `${m} phút trước`;
  const h = Math.round(m / 60);
  if (h < 24) return `${h} giờ trước`;
  const d = Math.round(h / 24);
  if (d < 30) return `${d} ngày trước`;
  return formatDate(ts);
}
