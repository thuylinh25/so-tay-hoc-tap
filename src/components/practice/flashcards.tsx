'use client';

import { useEffect, useMemo, useState } from 'react';
import { CheckCircle2, Layers, RotateCcw } from 'lucide-react';
import { inScope, scopeLabel, shuffle, useQa, type QaItem } from '@/lib/qa';
import { nextInterval, reviewCard, useLearning, type LearningState, type Rating } from '@/lib/store';
import { EmptyState, PageHeader, ProgressBar } from '../ui';
import { AnswerBody, Btn, Kbd, QaGate, QuestionText, ScopeSelect, Segmented, SourceLink } from './common';

const RATINGS: { r: Rating; label: string; key: string; tone: string }[] = [
  { r: 'again', label: 'Quên', key: '1', tone: 'border-danger/40 text-danger hover:bg-danger-soft' },
  { r: 'hard', label: 'Khó', key: '2', tone: 'border-warn/40 text-warn hover:bg-warn-soft' },
  { r: 'good', label: 'Nhớ', key: '3', tone: 'border-success/40 text-success hover:bg-success-soft' },
  { r: 'easy', label: 'Dễ', key: '4', tone: 'border-accent/40 text-accent hover:bg-accent-soft' },
];

function formatIvl(days: number) {
  if (days === 0) return '< 1 phút';
  if (days < 30) return `${days} ngày`;
  if (days < 365) return `${Math.round(days / 30)} tháng`;
  return `${(days / 365).toFixed(1)} năm`;
}

function deckStats(s: LearningState, pool: QaItem[], now: number) {
  let due = 0;
  let fresh = 0;
  let learned = 0;
  for (const i of pool) {
    const q = s.qa[i.id];
    if (q?.due == null) fresh++;
    else if (q.due <= now) due++;
    else learned++;
  }
  return { due, fresh, learned };
}

export function Flashcards() {
  const items = useQa();
  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6 px-4 py-8 sm:px-8">
      <PageHeader eyebrow="Ôn tập" title="Flashcards">
        Lặp lại ngắt quãng: thẻ nhớ tốt sẽ lâu mới gặp lại, thẻ quên sẽ quay lại ngay. Câu trả lời sai trong Quiz và Phỏng vấn cũng được đưa vào đây.
      </PageHeader>
      <QaGate items={items}>{(all) => <Deck all={all} />}</QaGate>
    </div>
  );
}

function Deck({ all }: { all: QaItem[] }) {
  const s = useLearning();
  const [scope, setScope] = useState('all');
  const [newLimit, setNewLimit] = useState(20);
  const [queue, setQueue] = useState<string[] | null>(null);
  const [done, setDone] = useState(0);
  const [revealed, setRevealed] = useState(false);

  const byId = useMemo(() => new Map(all.map((i) => [i.id, i])), [all]);
  const pool = useMemo(() => all.filter((i) => inScope(i, scope)), [all, scope]);
  const now = Date.now();
  const stats = deckStats(s, pool, now);

  function start() {
    const due = pool.filter((i) => (s.qa[i.id]?.due ?? Infinity) <= now).sort((a, b) => s.qa[a.id].due! - s.qa[b.id].due!);
    const fresh = shuffle(pool.filter((i) => s.qa[i.id]?.due == null)).slice(0, newLimit);
    setQueue([...due, ...fresh].map((i) => i.id));
    setDone(0);
    setRevealed(false);
  }

  const current = queue?.length ? byId.get(queue[0]) : undefined;

  function rate(r: Rating) {
    if (!current || !queue) return;
    reviewCard(current.id, r);
    const rest = queue.slice(1);
    setQueue(r === 'again' ? [...rest, current.id] : rest);
    if (r !== 'again') setDone((n) => n + 1);
    setRevealed(false);
  }

  useEffect(() => {
    if (!current) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLElement && e.target.closest('input,textarea,select')) return;
      if (!revealed && (e.key === ' ' || e.key === 'Enter')) {
        e.preventDefault();
        setRevealed(true);
      } else if (revealed) {
        const hit = RATINGS.find((x) => x.key === e.key);
        if (hit) rate(hit.r);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  if (queue === null) {
    return (
      <div className="flex flex-col gap-6">
        <div className="grid grid-cols-3 gap-3">
          <Stat label="Đến hạn" value={stats.due} tone="text-warn" />
          <Stat label="Chưa học" value={stats.fresh} tone="text-accent" />
          <Stat label="Đã thuộc" value={stats.learned} tone="text-success" />
        </div>
        <div className="grid gap-4 sm:grid-cols-[1fr_auto]">
          <ScopeSelect items={all} value={scope} onChange={setScope} />
          <Segmented
            label="Thẻ mới mỗi lượt"
            value={newLimit}
            onChange={setNewLimit}
            options={[10, 20, 50].map((n) => ({ value: n, label: String(n) }))}
          />
        </div>
        <Btn tone="primary" onClick={start} disabled={!stats.due && !stats.fresh} className="self-start">
          <Layers className="size-4" aria-hidden />
          Bắt đầu ôn {Math.min(stats.fresh, newLimit) + stats.due} thẻ
        </Btn>
        {!stats.due && !stats.fresh && <p className="text-sm text-muted">Không có thẻ nào đến hạn trong phạm vi này. Quay lại sau nhé.</p>}
      </div>
    );
  }

  if (!current) {
    return (
      <EmptyState icon={<CheckCircle2 className="size-6 text-success" />} title={`Xong! Đã ôn ${done} thẻ`}>
        <span className="flex flex-col items-center gap-3">
          Phạm vi: {scopeLabel(scope)}. Thẻ sẽ quay lại đúng lúc cần ôn.
          <Btn onClick={() => setQueue(null)}>
            <RotateCcw className="size-4" aria-hidden /> Về màn hình chọn
          </Btn>
        </span>
      </EmptyState>
    );
  }

  const total = done + queue.length;
  const q = s.qa[current.id];
  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-3 text-xs text-muted">
        <ProgressBar value={Math.round((done / total) * 100)} className="flex-1" />
        <span className="tabular">
          {done}/{total}
        </span>
        <button type="button" onClick={() => setQueue(null)} className="underline-offset-2 hover:text-ink hover:underline">
          Dừng
        </button>
      </div>

      <article className="flex min-h-72 flex-col gap-4 rounded-lg border border-line bg-surface p-5 shadow-(--shadow) sm:p-7">
        <div className="flex flex-wrap items-center gap-2 text-xs text-muted">
          <span className="eyebrow">{current.group ?? 'Câu hỏi'}</span>
          {q?.due == null && <span className="rounded bg-accent-soft px-1.5 py-0.5 text-accent">Mới</span>}
        </div>
        <QuestionText item={current} />
        {revealed ? (
          <div className="flex flex-col gap-3 border-t border-line pt-4">
            <AnswerBody item={current} />
            <SourceLink item={current} />
          </div>
        ) : (
          <Btn onClick={() => setRevealed(true)} className="mt-auto self-center">
            Hiện đáp án <Kbd>Space</Kbd>
          </Btn>
        )}
      </article>

      {revealed && (
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {RATINGS.map((x) => (
            <button
              key={x.r}
              type="button"
              onClick={() => rate(x.r)}
              className={`flex flex-col items-center rounded-md border bg-surface px-3 py-2 text-sm font-medium ${x.tone}`}
            >
              <span className="flex items-center gap-1.5">
                {x.label} <Kbd>{x.key}</Kbd>
              </span>
              <span className="text-xs font-normal opacity-80">{formatIvl(nextInterval(q, x.r))}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function Stat({ label, value, tone }: { label: string; value: number; tone: string }) {
  return (
    <div className="flex flex-col gap-0.5 rounded-lg border border-line bg-surface px-4 py-3">
      <span className={`font-display text-2xl font-bold tabular ${tone}`}>{value}</span>
      <span className="text-xs text-muted">{label}</span>
    </div>
  );
}
