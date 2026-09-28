'use client';

import Link from 'next/link';
import { useState } from 'react';
import { Bookmark, SearchX } from 'lucide-react';
import { docSummary, docsInDomain, domains, docsInTopic, topicsInDomain, type Doc } from '@/lib/content';
import { isBookmarked, percentDone, statusOf, useLearning, type LearningState } from '@/lib/store';
import { EmptyState, KindIcon, LevelBadge, PageHeader, ProgressBar, StatusIcon } from '../ui';

const FILTERS = [
  { id: 'all', label: 'Tất cả' },
  { id: 'not-started', label: 'Chưa học' },
  { id: 'learning', label: 'Đang học' },
  { id: 'completed', label: 'Đã học' },
  { id: 'bookmarked', label: 'Bookmark' },
] as const;
type Filter = (typeof FILTERS)[number]['id'];

function matches(s: LearningState, d: Doc, f: Filter) {
  if (f === 'all') return true;
  if (f === 'bookmarked') return s.bookmarks.some((b) => b.docSlug === d.slug);
  return statusOf(s, d.slug) === f;
}

export function Library() {
  const s = useLearning();
  const [filter, setFilter] = useState<Filter>('all');
  const total = domains.reduce((n, dm) => n + docsInDomain(dm.id).filter((d) => matches(s, d, filter)).length, 0);

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-8 px-4 py-8 sm:px-8">
      <PageHeader eyebrow="Thư viện" title="Toàn bộ tài liệu">
        Xếp theo lĩnh vực và chủ đề. Bài học (Markdown/HTML) đọc được và tìm được toàn văn; sổ tay dạng ảnh mới tìm được theo tên.
      </PageHeader>

      <div className="flex flex-wrap gap-1.5" role="tablist" aria-label="Lọc theo trạng thái">
        {FILTERS.map((f) => (
          <button
            key={f.id}
            type="button"
            role="tab"
            aria-selected={filter === f.id}
            onClick={() => setFilter(f.id)}
            className={`rounded-full border px-3 py-1.5 text-sm ${filter === f.id ? 'border-accent bg-accent-soft text-accent' : 'border-line bg-surface text-ink-2 hover:border-ink-2'}`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {total === 0 && (
        <EmptyState icon={<SearchX className="size-6" />} title="Không có tài liệu nào">
          Không có tài liệu nào ở trạng thái này.
        </EmptyState>
      )}

      {domains.map((dm) => {
        const all = docsInDomain(dm.id);
        const visible = all.filter((d) => matches(s, d, filter));
        if (!visible.length) return null;
        const pct = percentDone(
          s,
          all.map((d) => d.slug),
        );
        return (
          <section key={dm.id} id={dm.id} className="flex scroll-mt-20 flex-col gap-4">
            <div className="flex flex-wrap items-end justify-between gap-x-6 gap-y-2">
              <div className="flex flex-col gap-0.5">
                <h2 className="font-display text-xl font-semibold">{dm.title}</h2>
                <p className="text-sm text-muted">{dm.description}</p>
              </div>
              <div className="flex w-48 items-center gap-2 text-xs text-muted">
                <ProgressBar value={pct} className="flex-1" />
                <span className="tabular">{pct}%</span>
              </div>
            </div>
            <div className="flex flex-col gap-4">
              {topicsInDomain(dm.id).map((t) => {
                const list = docsInTopic(t.id).filter((d) => matches(s, d, filter));
                if (!list.length) return null;
                return (
                  <div key={t.id} className="flex flex-col gap-1.5">
                    <h3 className="eyebrow flex gap-2">
                      {t.title} <span className="tabular">· {docsInTopic(t.id).length}</span>
                    </h3>
                    <ul className="flex flex-col divide-y divide-line overflow-hidden rounded-lg border border-line bg-surface">
                      {list.map((d) => (
                        <li key={d.slug}>
                          <Link href={`/learn/${d.slug}`} className="flex items-center gap-3 px-4 py-3 hover:bg-sunk">
                            <StatusIcon status={statusOf(s, d.slug)} />
                            <KindIcon kind={d.kind} className="size-4 text-muted" />
                            <span className="flex min-w-0 flex-1 flex-col">
                              <span className="font-medium">{d.title}</span>
                              {d.subtitle && <span className="truncate text-xs text-muted">{d.subtitle}</span>}
                            </span>
                            {isBookmarked(s, d.slug) && <Bookmark className="size-3.5 shrink-0 text-warn" fill="currentColor" aria-label="Đã bookmark" />}
                            <span className="hidden shrink-0 text-xs text-muted sm:inline">{docSummary(d)}</span>
                            <span className="hidden shrink-0 sm:inline">
                              <LevelBadge level={d.level} />
                            </span>
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </div>
                );
              })}
            </div>
          </section>
        );
      })}
    </div>
  );
}
