'use client';

import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { docSummary, getDoc, getRoadmap, getTopic, roadmaps, type Roadmap } from '@/lib/content';
import { percentDone, statusOf, useLearning, type LearningState } from '@/lib/store';
import { KindIcon, LevelBadge, PageHeader, ProgressBar } from '../ui';

type NodeState = 'completed' | 'current' | 'learning' | 'not-started';

/** Bước hiện tại = bước đầu tiên chưa học xong. Các bước sau đó đang mở dở vẫn hiện "Đang học". */
export function roadmapStates(s: LearningState, r: Roadmap): NodeState[] {
  const current = r.steps.findIndex((slug) => statusOf(s, slug) !== 'completed');
  return r.steps.map((slug, i) => {
    const st = statusOf(s, slug);
    if (st === 'completed') return 'completed';
    if (i === current) return 'current';
    return st === 'learning' ? 'learning' : 'not-started';
  });
}

const stateLabel: Record<NodeState, string> = { completed: 'Đã học', current: 'Bước hiện tại', learning: 'Đang học', 'not-started': 'Chưa học' };

export function RoadmapsIndex() {
  const s = useLearning();
  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-8 px-4 py-8 sm:px-8">
      <PageHeader eyebrow="Lộ trình" title="Lộ trình học">
        Mỗi lộ trình là chuỗi tài liệu thật trong kho, xếp theo thứ tự nên học.
      </PageHeader>
      <ul className="grid gap-4 md:grid-cols-2">
        {roadmaps.map((r) => {
          const pct = percentDone(s, r.steps);
          const states = roadmapStates(s, r);
          const cur = r.steps[states.indexOf('current')];
          return (
            <li key={r.id}>
              <Link href={`/roadmaps/${r.id}`} className="flex h-full flex-col gap-3 rounded-xl border border-line bg-surface p-5 hover:border-accent">
                <div className="flex items-baseline justify-between gap-3">
                  <h2 className="font-display text-lg font-semibold">{r.title}</h2>
                  <span className="tabular shrink-0 text-sm text-muted">{r.steps.length} bước</span>
                </div>
                <p className="flex-1 text-sm text-ink-2">{r.description}</p>
                <div className="flex gap-1" aria-hidden>
                  {states.map((st, i) => (
                    <span
                      key={i}
                      className={`h-1.5 flex-1 rounded-full ${st === 'completed' ? 'bg-success' : st === 'current' ? 'bg-accent' : st === 'learning' ? 'bg-accent/40' : 'bg-sunk'}`}
                    />
                  ))}
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="truncate text-muted">{cur ? `Tiếp theo: ${getDoc(cur)?.title}` : 'Đã hoàn thành'}</span>
                  <span className="tabular shrink-0 font-medium">{pct}%</span>
                </div>
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

export function RoadmapDetail({ id }: { id: string }) {
  const s = useLearning();
  const r = getRoadmap(id)!;
  const states = roadmapStates(s, r);
  const pct = percentDone(s, r.steps);

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-8 px-4 py-8 sm:px-8">
      <PageHeader eyebrow="Lộ trình" title={r.title}>
        {r.description}
      </PageHeader>
      <div className="flex items-center gap-3 text-sm text-muted">
        <ProgressBar value={pct} className="flex-1" />
        <span className="tabular">{pct}%</span>
      </div>
      <ol className="relative flex flex-col">
        {r.steps.map((slug, i) => {
          const d = getDoc(slug);
          if (!d) return null;
          const st = states[i];
          const last = i === r.steps.length - 1;
          return (
            <li key={slug} className="relative flex gap-4 pb-6">
              {!last && <span className={`absolute top-8 bottom-0 left-[0.95rem] w-0.5 ${st === 'completed' ? 'bg-success' : 'bg-line'}`} aria-hidden />}
              <span
                className={`tabular z-10 grid size-8 shrink-0 place-items-center rounded-full border-2 text-sm font-semibold ${
                  st === 'completed'
                    ? 'border-success bg-success text-surface'
                    : st === 'current'
                      ? 'border-accent bg-accent-soft text-accent'
                      : st === 'learning'
                        ? 'border-accent/50 bg-surface text-accent'
                        : 'border-line bg-surface text-muted'
                }`}
                aria-label={stateLabel[st]}
              >
                {st === 'completed' ? '✓' : i + 1}
              </span>
              <Link
                href={`/learn/${slug}`}
                className={`flex min-w-0 flex-1 flex-col gap-1.5 rounded-lg border bg-surface px-4 py-3 hover:border-accent ${st === 'current' ? 'border-accent shadow-pop' : 'border-line'}`}
              >
                <span className="flex flex-wrap items-center gap-2 text-xs text-muted">
                  <KindIcon kind={d.kind} className="size-3.5" /> {getTopic(d.topic)?.title} · {docSummary(d)}
                  <LevelBadge level={d.level} />
                  <span className={`ml-auto font-medium ${st === 'current' ? 'text-accent' : st === 'completed' ? 'text-success' : ''}`}>{stateLabel[st]}</span>
                </span>
                <span className="font-display font-semibold">{d.title}</span>
                {st === 'current' && (
                  <span className="inline-flex items-center gap-1 text-sm text-accent">
                    {statusOf(s, slug) === 'learning' ? 'Học tiếp' : 'Bắt đầu'} <ArrowRight className="size-3.5" />
                  </span>
                )}
              </Link>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
