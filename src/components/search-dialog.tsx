'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import MiniSearch, { type SearchResult } from 'minisearch';
import { CornerDownLeft, Hash, Search, X } from 'lucide-react';
import { excerpt, fold, tokenize } from '@/lib/text';
import { getDoc } from '@/lib/content';
import { KindIcon } from './ui';

interface Entry {
  id: string;
  slug: string;
  anchor: string | null;
  title: string;
  category: string;
  heading: string;
  text: string;
}

let indexPromise: Promise<MiniSearch<Entry>> | null = null;

function loadIndex() {
  indexPromise ??= fetch('/search-index.json')
    .then((r) => r.json() as Promise<Entry[]>)
    .then((entries) => {
      const ms = new MiniSearch<Entry>({
        fields: ['title', 'category', 'heading', 'text'],
        storeFields: ['slug', 'anchor', 'title', 'category', 'heading', 'text'],
        tokenize,
        processTerm: (t) => fold(t),
        searchOptions: { prefix: true, fuzzy: 0.15, combineWith: 'AND', boost: { title: 4, heading: 2.5, category: 1.5 } },
      });
      ms.addAll(entries);
      return ms;
    });
  return indexPromise;
}

type Hit = SearchResult & Entry;

export function SearchDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [index, setIndex] = useState<MiniSearch<Entry> | null>(null);
  const [error, setError] = useState(false);
  const [active, setActive] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);

  useEffect(() => {
    if (!open) return;
    setActive(0);
    requestAnimationFrame(() => inputRef.current?.select());
    loadIndex().then(setIndex, () => setError(true));
  }, [open]);

  const results = useMemo(() => {
    if (!index || query.trim().length < 2) return [];
    let hits = index.search(query) as Hit[];
    if (!hits.length) hits = index.search(query, { combineWith: 'OR' }) as Hit[];
    // Mỗi tài liệu tối đa 4 kết quả để danh sách không bị một bài chiếm hết.
    const perDoc = new Map<string, number>();
    return hits
      .filter((h) => {
        const n = perDoc.get(h.slug) ?? 0;
        perDoc.set(h.slug, n + 1);
        return n < 4;
      })
      .slice(0, 30);
  }, [index, query]);

  useEffect(() => setActive(0), [query]);
  useEffect(() => {
    listRef.current?.querySelector(`[data-i="${active}"]`)?.scrollIntoView({ block: 'nearest' });
  }, [active]);

  if (!open) return null;

  const go = (h: Hit) => {
    onClose();
    router.push(`/learn/${h.slug}${h.anchor ? `#${h.anchor}` : ''}`);
  };

  const onKey = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActive((a) => Math.min(a + 1, results.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActive((a) => Math.max(a - 1, 0));
    } else if (e.key === 'Enter' && results[active]) {
      e.preventDefault();
      go(results[active]);
    } else if (e.key === 'Escape') {
      onClose();
    }
  };

  const terms = tokenize(query);

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-ink/30 px-4 pt-[10vh] backdrop-blur-[2px]" onMouseDown={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Tìm kiếm"
        className="flex max-h-[75vh] w-full max-w-2xl flex-col overflow-hidden rounded-xl border border-line bg-surface shadow-pop"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-3 border-b border-line px-4">
          <Search className="size-5 shrink-0 text-muted" aria-hidden />
          <input
            id="global-search"
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={onKey}
            placeholder="Tìm bài, mục, nội dung… (gõ không dấu cũng được)"
            className="h-14 min-w-0 flex-1 bg-transparent text-base outline-none placeholder:text-muted"
            autoComplete="off"
            spellCheck={false}
          />
          <button type="button" onClick={onClose} className="grid size-8 place-items-center rounded-md text-muted hover:bg-sunk" aria-label="Đóng">
            <X className="size-4" />
          </button>
        </div>

        <ul ref={listRef} className="flex-1 overflow-y-auto p-2" role="listbox">
          {error && <li className="px-3 py-6 text-center text-sm text-danger">Không tải được chỉ mục tìm kiếm. Hãy tải lại trang.</li>}
          {!error && !index && open && <li className="px-3 py-6 text-center text-sm text-muted">Đang tải chỉ mục…</li>}
          {index && query.trim().length < 2 && (
            <li className="px-3 py-6 text-center text-sm text-muted">Gõ ít nhất 2 ký tự. Ví dụ: “polymorphism”, “stale element”, “xpath”, “inner join”.</li>
          )}
          {index && query.trim().length >= 2 && !results.length && (
            <li className="px-3 py-6 text-center text-sm text-muted">Không có kết quả cho “{query}”.</li>
          )}
          {results.map((h, i) => {
            const doc = getDoc(h.slug);
            return (
              <li key={h.id} data-i={i} role="option" aria-selected={i === active}>
                <button
                  type="button"
                  onClick={() => go(h)}
                  onMouseMove={() => setActive(i)}
                  className={`flex w-full gap-3 rounded-lg px-3 py-2.5 text-left ${i === active ? 'bg-accent-soft' : ''}`}
                >
                  <span className="mt-0.5 text-muted">{h.anchor ? <Hash className="size-4" /> : <KindIcon kind={doc?.kind ?? 'markdown'} />}</span>
                  <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                    <span className="flex flex-wrap items-baseline gap-x-2">
                      <span className="font-medium">{h.heading || h.title}</span>
                      {h.heading && <span className="truncate text-xs text-muted">{h.title}</span>}
                    </span>
                    <span className="text-xs text-muted">{h.category}</span>
                    {h.text && (
                      <span className="line-clamp-2 text-sm text-ink-2">
                        {excerpt(h.text, terms).map((s, k) => (s.hit ? <mark key={k}>{s.text}</mark> : <span key={k}>{s.text}</span>))}
                      </span>
                    )}
                  </span>
                  {i === active && <CornerDownLeft className="mt-1 size-4 shrink-0 text-muted" aria-hidden />}
                </button>
              </li>
            );
          })}
        </ul>
        <div className="flex gap-4 border-t border-line px-4 py-2 text-xs text-muted">
          <span>↑↓ chọn</span>
          <span>Enter mở</span>
          <span>Esc đóng</span>
          <span className="ml-auto">Nội dung trong ảnh chưa tìm được (cần OCR)</span>
        </div>
      </div>
    </div>
  );
}
