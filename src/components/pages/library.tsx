'use client';

import Link from 'next/link';
import { useState } from 'react';
import { Bookmark, Plus, SearchX } from 'lucide-react';
import { docSummary, type Doc } from '@/lib/content';
import { useIsAdmin, useMergedContent } from '@/lib/dynamic';
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
  const admin = useIsAdmin();
  const { categories, docsInCategory, docsInDomain, docsInTopic, domainsInCategory, topicsInDomain } = useMergedContent();
  const [filter, setFilter] = useState<Filter>('all');
  const total = categories.reduce((n, c) => n + docsInCategory(c.id).filter((d) => matches(s, d, filter)).length, 0);

  const docList = (list: Doc[]) => (
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
  );

  return (
    <div className="mx-auto flex max-w-[1080px] flex-col gap-10 px-4 py-8 sm:px-8">
      <PageHeader eyebrow="Thư viện" title="Toàn bộ tài liệu">
        Xếp theo nhóm, lĩnh vực và chủ đề. Bài học (Markdown/HTML) đọc được và tìm được toàn văn; sổ tay dạng ảnh mới tìm được theo tên.
      </PageHeader>

      <div className="flex flex-wrap items-center justify-between gap-3">
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
        {admin && (
          <Link
            href="/new"
            className="inline-flex items-center gap-1.5 rounded-full bg-accent px-3.5 py-1.5 text-sm font-medium text-accent-ink hover:opacity-90"
          >
            <Plus className="size-4" aria-hidden /> Bài viết mới
          </Link>
        )}
      </div>

      {total === 0 && (
        <EmptyState icon={<SearchX className="size-6" />} title="Không có tài liệu nào">
          Không có tài liệu nào ở trạng thái này.
        </EmptyState>
      )}

      {categories.map((cat) => {
        const catDocs = docsInCategory(cat.id);
        const catVisible = catDocs.filter((d) => matches(s, d, filter));
        if (!catVisible.length) return null;
        const catPct = percentDone(
          s,
          catDocs.map((d) => d.slug),
        );
        return (
          <div key={cat.id} className="flex flex-col gap-6">
            <div className="flex flex-col gap-2 border-b border-line pb-3">
              <div className="flex flex-col gap-0.5">
                <h2 className="font-display text-2xl font-semibold">{cat.title}</h2>
                <p className="text-sm text-muted">{cat.description}</p>
              </div>
              <div className="flex max-w-sm items-center gap-2 text-xs text-muted">
                <ProgressBar value={catPct} className="flex-1" />
                <span className="tabular">{catPct}%</span>
              </div>
            </div>

            {cat.layout === 'flat' ? (
              // Sức khỏe: bài hiển thị trực tiếp dưới nhóm.
              <section id={cat.id} className="scroll-mt-20">{docList(catVisible)}</section>
            ) : (
              domainsInCategory(cat.id).map((dm) => {
                const all = docsInDomain(dm.id);
                const visible = all.filter((d) => matches(s, d, filter));
                if (!visible.length) return null;
                const pct = percentDone(
                  s,
                  all.map((d) => d.slug),
                );
                return (
                  <section key={dm.id} id={dm.id} className="flex scroll-mt-20 flex-col gap-4">
                    <div className="flex flex-col gap-1.5">
                      <div className="flex flex-col gap-0.5">
                        <h3 className="font-display text-xl font-semibold">{dm.title}</h3>
                        <p className="text-sm text-muted">{dm.description}</p>
                      </div>
                      <div className="flex max-w-xs items-center gap-2 text-xs text-muted">
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
                            <h4 className="eyebrow flex gap-2">
                              {t.title} <span className="tabular">· {docsInTopic(t.id).length}</span>
                            </h4>
                            {docList(list)}
                          </div>
                        );
                      })}
                    </div>
                  </section>
                );
              })
            )}
          </div>
        );
      })}
    </div>
  );
}
