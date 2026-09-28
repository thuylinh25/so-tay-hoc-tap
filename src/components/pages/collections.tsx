'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { Bookmark, NotebookPen, Search, Trash2 } from 'lucide-react';
import { domains, getDoc, tocHeadings } from '@/lib/content';
import { fold } from '@/lib/text';
import { removeBookmark, useLearning } from '@/lib/store';
import { NoteCard } from '../notes';
import { EmptyState, KindIcon, PageHeader, formatDate } from '../ui';

export function BookmarksPage() {
  const s = useLearning();
  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-8 px-4 py-8 sm:px-8">
      <PageHeader eyebrow="Bookmark" title="Đã đánh dấu">
        Bookmark cả bài bằng nút trong trang đọc, hoặc bookmark từng mục bằng biểu tượng cạnh mục đó trong mục lục.
      </PageHeader>
      {!s.bookmarks.length && <EmptyState icon={<Bookmark className="size-6" />} title="Chưa có bookmark" />}
      {domains.map((dm) => {
        const list = s.bookmarks.filter((b) => getDoc(b.docSlug)?.domain === dm.id);
        if (!list.length) return null;
        return (
          <section key={dm.id} className="flex flex-col gap-3">
            <h2 className="font-display text-lg font-semibold">
              {dm.title} <span className="tabular text-sm font-normal text-muted">· {list.length}</span>
            </h2>
            <ul className="flex flex-col divide-y divide-line overflow-hidden rounded-lg border border-line bg-surface">
              {list.map((b) => {
                const d = getDoc(b.docSlug)!;
                return (
                  <li key={b.id} className="flex items-center gap-3 px-4 py-3">
                    <KindIcon kind={d.kind} className="size-4 text-muted" />
                    <Link href={`/learn/${d.slug}${b.sectionId ? `#${b.sectionId}` : ''}`} className="flex min-w-0 flex-1 flex-col hover:text-accent">
                      <span className="font-medium">{b.sectionTitle ?? d.title}</span>
                      <span className="truncate text-xs text-muted">{b.sectionTitle ? d.title : 'Cả bài'} · {formatDate(b.createdAt)}</span>
                    </Link>
                    <button type="button" onClick={() => removeBookmark(b.id)} className="grid size-8 place-items-center rounded text-muted hover:bg-sunk hover:text-danger" aria-label="Bỏ bookmark">
                      <Trash2 className="size-4" />
                    </button>
                  </li>
                );
              })}
            </ul>
          </section>
        );
      })}
    </div>
  );
}

export function NotesPage() {
  const s = useLearning();
  const [q, setQ] = useState('');
  const filtered = useMemo(() => {
    const needle = fold(q.trim());
    if (!needle) return s.notes;
    return s.notes.filter((n) => fold(`${n.body} ${n.sectionTitle ?? ''} ${getDoc(n.docSlug)?.title ?? ''}`).includes(needle));
  }, [s.notes, q]);
  const bySlug = new Map<string, typeof filtered>();
  for (const n of filtered) bySlug.set(n.docSlug, [...(bySlug.get(n.docSlug) ?? []), n]);

  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-8 px-4 py-8 sm:px-8">
      <PageHeader eyebrow="Ghi chú" title="Ghi chú cá nhân">
        Tạo ghi chú trong trang đọc (nút “Ghi chú”). Ghi chú gắn với bài hoặc với một mục cụ thể và hỗ trợ Markdown.
      </PageHeader>
      <label className="flex h-10 items-center gap-2 rounded-md border border-line bg-surface px-3 focus-within:border-accent">
        <Search className="size-4 text-muted" aria-hidden />
        <input id="notes-search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Tìm trong ghi chú…" className="min-w-0 flex-1 bg-transparent text-sm outline-none" />
      </label>
      {!s.notes.length && <EmptyState icon={<NotebookPen className="size-6" />} title="Chưa có ghi chú" />}
      {s.notes.length > 0 && !filtered.length && <p className="text-sm text-muted">Không có ghi chú nào khớp “{q}”.</p>}
      {[...bySlug.entries()].map(([slug, notes]) => {
        const d = getDoc(slug);
        if (!d) return null;
        return (
          <section key={slug} className="flex flex-col gap-3">
            <h2 className="flex items-center gap-2 font-display font-semibold">
              <KindIcon kind={d.kind} className="size-4 text-muted" />
              <Link href={`/learn/${slug}`} className="hover:text-accent">
                {d.title}
              </Link>
              <span className="tabular text-sm font-normal text-muted">· {notes.length}</span>
            </h2>
            <div className="grid gap-3 md:grid-cols-2">
              {notes.map((n) => (
                <NoteCard
                  key={n.id}
                  note={n}
                  headings={tocHeadings(d)}
                  showDoc={
                    n.sectionId ? (
                      <Link href={`/learn/${slug}#${n.sectionId}`} className="text-accent">
                        Mở mục →
                      </Link>
                    ) : undefined
                  }
                />
              ))}
            </div>
          </section>
        );
      })}
    </div>
  );
}
