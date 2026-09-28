'use client';

import Link from 'next/link';
import type { ReactNode } from 'react';
import { ArrowUpRight, CircleAlert, Loader2 } from 'lucide-react';
import { scopeOptions, sourceHref, sourceLabel, type QaItem } from '@/lib/qa';
import { EmptyState } from '../ui';

export function QaGate({ items, children }: { items: QaItem[] | null | 'error'; children: (items: QaItem[]) => ReactNode }) {
  if (items === null)
    return (
      <div className="flex items-center gap-2 py-12 text-sm text-muted">
        <Loader2 className="size-4 animate-spin" aria-hidden /> Đang tải câu hỏi…
      </div>
    );
  if (items === 'error' || !items.length)
    return (
      <EmptyState icon={<CircleAlert className="size-6" />} title={items === 'error' ? 'Không tải được câu hỏi' : 'Chưa có câu hỏi nào'}>
        {items === 'error' ? 'Thử tải lại trang.' : 'Câu hỏi được chép từ tài liệu vào thư mục qa/ rồi build lại.'}
      </EmptyState>
    );
  return <>{children(items)}</>;
}

export function ScopeSelect({ items, value, onChange, filter }: { items: QaItem[]; value: string; onChange: (v: string) => void; filter?: (i: QaItem) => boolean }) {
  const pool = filter ? items.filter(filter) : items;
  return (
    <label className="flex flex-col gap-1.5 text-sm">
      <span className="eyebrow">Phạm vi</span>
      <select value={value} onChange={(e) => onChange(e.target.value)} className="h-10 rounded-md border border-line bg-surface px-2">
        <option value="all">Tất cả ({pool.length} câu)</option>
        {scopeOptions(pool).map((g) => (
          <optgroup key={g.label} label={g.label}>
            {g.options.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label} ({o.n})
              </option>
            ))}
          </optgroup>
        ))}
      </select>
    </label>
  );
}

export function Segmented<T extends string | number>({ label, options, value, onChange }: { label: string; options: { value: T; label: string }[]; value: T; onChange: (v: T) => void }) {
  return (
    <div className="flex flex-col gap-1.5 text-sm">
      <span className="eyebrow">{label}</span>
      <div className="flex flex-wrap gap-1.5" role="radiogroup" aria-label={label}>
        {options.map((o) => (
          <button
            key={String(o.value)}
            type="button"
            role="radio"
            aria-checked={value === o.value}
            onClick={() => onChange(o.value)}
            className={`h-10 rounded-md border px-3 ${value === o.value ? 'border-accent bg-accent-soft text-accent' : 'border-line bg-surface text-ink-2 hover:border-ink-2'}`}
          >
            {o.label}
          </button>
        ))}
      </div>
    </div>
  );
}

export function QuestionText({ item, className = '' }: { item: QaItem; className?: string }) {
  return <h2 className={`qa-question font-display text-xl font-semibold leading-snug ${className}`} dangerouslySetInnerHTML={{ __html: item.qHtml }} />;
}

export function AnswerBody({ item }: { item: QaItem }) {
  return <div className="article text-[0.95rem]" dangerouslySetInnerHTML={{ __html: item.aHtml }} />;
}

export function SourceLink({ item }: { item: QaItem }) {
  return (
    <Link href={sourceHref(item)} className="inline-flex items-center gap-1 text-xs text-muted underline-offset-2 hover:text-accent hover:underline">
      Nguồn: {sourceLabel(item)}
      <ArrowUpRight className="size-3" aria-hidden />
    </Link>
  );
}

export function Btn({ children, onClick, tone = 'default', className = '', ...rest }: { children: ReactNode; onClick?: () => void; tone?: 'primary' | 'default'; className?: string; disabled?: boolean; type?: 'button' | 'submit' }) {
  const t = tone === 'primary' ? 'border-accent bg-accent text-accent-ink hover:opacity-90' : 'border-line bg-surface text-ink hover:border-ink-2';
  return (
    <button type="button" onClick={onClick} className={`inline-flex h-10 items-center justify-center gap-2 rounded-md border px-4 text-sm font-medium disabled:opacity-50 ${t} ${className}`} {...rest}>
      {children}
    </button>
  );
}

export function Kbd({ children }: { children: ReactNode }) {
  return <kbd className="hidden rounded border border-current/30 px-1 font-mono text-[0.65rem] opacity-70 sm:inline">{children}</kbd>;
}
