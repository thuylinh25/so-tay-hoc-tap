'use client';

import Link from 'next/link';
import { ArrowRight, Bookmark, Flame, Sparkles } from 'lucide-react';
import { docs, docsInDomain, domains, getDoc, getRoadmap, getTopic, type Doc } from '@/lib/content';
import { percentDone, statusOf, streak, useLearning, type LearningState } from '@/lib/store';
import { KindIcon, ProgressBar, StatusIcon, timeAgo } from '../ui';

function nextInRoadmap(s: LearningState, exclude: string | null): Doc | null {
  const r = getRoadmap('automation-tester');
  const slug = r?.steps.find((x) => statusOf(s, x) !== 'completed' && x !== exclude);
  return slug ? getDoc(slug) ?? null : null;
}

export function Dashboard() {
  const s = useLearning();
  const opened = Object.entries(s.progress)
    .sort((a, b) => b[1].lastOpened - a[1].lastOpened)
    .map(([slug, p]) => ({ doc: getDoc(slug), p }))
    .filter((x): x is { doc: Doc; p: (typeof x)['p'] } => !!x.doc);
  const current = opened.find((x) => x.p.status === 'learning') ?? null;
  const recommended = nextInRoadmap(s, current?.doc.slug ?? null);

  const completed = docs.filter((d) => statusOf(s, d.slug) === 'completed').length;
  const learningCount = docs.filter((d) => statusOf(s, d.slug) === 'learning').length;
  const stats = [
    { label: 'Đã học', value: completed, sub: `/ ${docs.length} tài liệu` },
    { label: 'Đang học', value: learningCount },
    { label: 'Chưa học', value: docs.length - completed - learningCount },
    { label: 'Bookmark', value: s.bookmarks.length },
    { label: 'Ghi chú', value: s.notes.length },
    { label: 'Chuỗi ngày học', value: streak(s), sub: 'ngày', icon: <Flame className="size-4 text-warn" aria-hidden /> },
  ];

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-10 px-4 py-8 sm:px-8">
      <header className="flex flex-col gap-1">
        <div className="eyebrow" suppressHydrationWarning>{new Date().toLocaleDateString('vi-VN', { weekday: 'long', day: 'numeric', month: 'long' })}</div>
        <h1 className="font-display text-3xl font-bold tracking-tight">Sổ tay học tập</h1>
        <p className="text-ink-2">
          {docs.length} tài liệu trong {domains.length} lĩnh vực. Nhấn <kbd className="rounded border border-line px-1 font-mono text-xs">Ctrl K</kbd> để tìm.
        </p>
      </header>

      <section className="grid gap-4 lg:grid-cols-[3fr_2fr]">
        <div className="flex flex-col gap-4 rounded-xl border border-line bg-surface p-5">
          <div className="eyebrow">{current ? 'Tiếp tục học' : 'Bắt đầu từ đây'}</div>
          {(() => {
            const d = current?.doc ?? recommended ?? docs[0];
            const pct = current ? Math.round(current.p.readPct * 100) : 0;
            return (
              <>
                <div className="flex flex-col gap-1">
                  <span className="text-sm text-muted">{getTopic(d.topic)?.title}</span>
                  <Link href={`/learn/${d.slug}`} className="font-display text-xl font-semibold hover:text-accent">
                    {d.title}
                  </Link>
                  {current && <span className="text-xs text-muted">Mở {timeAgo(current.p.lastOpened)}</span>}
                </div>
                {current && (
                  <div className="flex items-center gap-3">
                    <ProgressBar value={pct} className="flex-1" />
                    <span className="tabular text-sm text-muted">{pct}%</span>
                  </div>
                )}
                <Link href={`/learn/${d.slug}`} className="inline-flex w-fit items-center gap-2 rounded-md bg-accent px-4 py-2 text-sm font-medium text-accent-ink hover:opacity-90">
                  {current ? 'Học tiếp' : 'Bắt đầu'} <ArrowRight className="size-4" />
                </Link>
              </>
            );
          })()}
        </div>

        <div className="flex flex-col gap-3 rounded-xl border border-line bg-surface p-5">
          <div className="eyebrow flex items-center gap-1.5">
            <Sparkles className="size-3.5" aria-hidden /> Bài nên học tiếp
          </div>
          {recommended ? (
            <>
              <Link href={`/learn/${recommended.slug}`} className="font-display text-lg font-semibold hover:text-accent">
                {recommended.title}
              </Link>
              <p className="text-sm text-muted">
                Bước tiếp theo trong{' '}
                <Link href="/roadmaps/automation-tester" className="text-accent underline underline-offset-2">
                  Lộ trình Automation Tester
                </Link>
                .
              </p>
            </>
          ) : (
            <p className="text-sm text-muted">Bạn đã hoàn thành Lộ trình Automation Tester.</p>
          )}
        </div>
      </section>

      <section className="grid grid-cols-2 gap-px overflow-hidden rounded-xl border border-line bg-line sm:grid-cols-3 lg:grid-cols-6">
        {stats.map((st) => (
          <div key={st.label} className="flex flex-col gap-1 bg-surface px-4 py-3">
            <span className="flex items-center gap-1.5 text-xs text-muted">
              {st.icon}
              {st.label}
            </span>
            <span className="tabular font-display text-2xl font-bold">
              {st.value}
              {st.sub && <span className="ml-1 text-sm font-normal text-muted">{st.sub}</span>}
            </span>
          </div>
        ))}
      </section>

      <div className="grid gap-10 lg:grid-cols-2">
        <section className="flex flex-col gap-4">
          <h2 className="font-display text-lg font-semibold">Tiến độ theo lĩnh vực</h2>
          <ul className="flex flex-col gap-3">
            {domains.map((dm) => {
              const list = docsInDomain(dm.id);
              const pct = percentDone(
                s,
                list.map((d) => d.slug),
              );
              const done = list.filter((d) => statusOf(s, d.slug) === 'completed').length;
              return (
                <li key={dm.id}>
                  <Link href={`/library#${dm.id}`} className="group flex flex-col gap-1.5">
                    <span className="flex items-baseline justify-between text-sm">
                      <span className="font-medium group-hover:text-accent">{dm.title}</span>
                      <span className="tabular text-muted">
                        {done}/{list.length} · {pct}%
                      </span>
                    </span>
                    <ProgressBar value={pct} />
                  </Link>
                </li>
              );
            })}
          </ul>
        </section>

        <section className="flex flex-col gap-4">
          <h2 className="font-display text-lg font-semibold">Xem gần đây</h2>
          {opened.length ? (
            <ul className="flex flex-col divide-y divide-line rounded-xl border border-line bg-surface">
              {opened.slice(0, 6).map(({ doc, p }) => (
                <li key={doc.slug}>
                  <Link href={`/learn/${doc.slug}`} className="flex items-center gap-3 px-4 py-2.5 hover:bg-sunk">
                    <StatusIcon status={statusOf(s, doc.slug)} />
                    <span className="min-w-0 flex-1 truncate text-sm">{doc.title}</span>
                    <span className="shrink-0 text-xs text-muted">{timeAgo(p.lastOpened)}</span>
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-muted">Chưa mở bài nào.</p>
          )}

          <h2 className="mt-4 flex items-center gap-2 font-display text-lg font-semibold">
            <Bookmark className="size-4" aria-hidden /> Bookmark
          </h2>
          {s.bookmarks.length ? (
            <ul className="flex flex-col gap-1.5">
              {s.bookmarks.slice(0, 5).map((b) => {
                const d = getDoc(b.docSlug);
                if (!d) return null;
                return (
                  <li key={b.id}>
                    <Link href={`/learn/${d.slug}${b.sectionId ? `#${b.sectionId}` : ''}`} className="flex items-center gap-2 text-sm hover:text-accent">
                      <KindIcon kind={d.kind} className="size-3.5 text-muted" />
                      <span className="truncate">
                        {b.sectionTitle ? `${b.sectionTitle} — ` : ''}
                        <span className="text-muted">{d.title}</span>
                      </span>
                    </Link>
                  </li>
                );
              })}
              <li>
                <Link href="/bookmarks" className="text-sm text-accent">
                  Xem tất cả →
                </Link>
              </li>
            </ul>
          ) : (
            <p className="text-sm text-muted">Bấm Bookmark trong bài, hoặc biểu tượng bookmark cạnh từng mục trong mục lục.</p>
          )}
        </section>
      </div>
    </div>
  );
}
