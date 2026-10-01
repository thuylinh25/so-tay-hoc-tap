'use client';

// Trình đọc cho bài động (D1). Shell này được Pages Function /learn/<slug> phục vụ khi slug
// không phải bài static: đọc slug từ path, fetch /api/articles/<slug>, render Markdown client-side,
// và dùng store sẵn có nên Bookmark/đã đọc hoạt động y như bài static (key theo slug).
import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import Markdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Bookmark, Check, RotateCcw } from 'lucide-react';
import { getCategory, getDomain, levelLabel, type Level } from '@/lib/content';
import { isBookmarked, markOpened, setStatus, statusOf, toggleBookmark, useLearning } from '@/lib/store';
import { StatusBadge } from '../ui';

interface DynArticleFull {
  slug: string;
  title: string;
  domain: string;
  category: string;
  tags: string[];
  level: Level;
  status: 'draft' | 'published';
  content: string;
}

function slugFromPath(): string {
  if (typeof window === 'undefined') return '';
  const m = /^\/learn\/([^/?#]+)/.exec(window.location.pathname);
  if (m) return decodeURIComponent(m[1]);
  return new URLSearchParams(window.location.search).get('slug') ?? '';
}

export function DynamicReader() {
  const learning = useLearning();
  const [slug, setSlug] = useState('');
  const [state, setState] = useState<'loading' | 'notfound' | 'ok'>('loading');
  const [article, setArticle] = useState<DynArticleFull | null>(null);

  useEffect(() => {
    const s = slugFromPath();
    setSlug(s);
    if (!s) {
      setState('notfound');
      return;
    }
    let alive = true;
    fetch(`/api/articles/${encodeURIComponent(s)}`, { credentials: 'same-origin' })
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((d) => {
        if (!alive) return;
        setArticle(d.article);
        setState('ok');
        markOpened(s);
      })
      .catch(() => alive && setState('notfound'));
    return () => {
      alive = false;
    };
  }, []);

  const status = statusOf(learning, slug);
  const bookmarked = isBookmarked(learning, slug, null);
  const domain = useMemo(() => (article ? getDomain(article.domain) : undefined), [article]);
  const category = useMemo(() => (article ? getCategory(article.category) : undefined), [article]);

  if (state === 'loading') return <div className="mx-auto max-w-3xl px-4 py-16 text-center text-sm text-muted sm:px-8">Đang tải bài viết…</div>;

  if (state === 'notfound' || !article)
    return (
      <div className="mx-auto flex max-w-3xl flex-col items-center gap-3 px-4 py-16 text-center sm:px-8">
        <h1 className="font-display text-2xl font-semibold">Không tìm thấy bài viết</h1>
        <p className="text-sm text-muted">Bài viết không tồn tại hoặc chưa được xuất bản.</p>
        <Link href="/library" className="text-accent hover:underline">
          ← Về Thư viện
        </Link>
      </div>
    );

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6 px-4 py-8 sm:px-8">
      <div className="flex flex-col gap-3">
        <nav className="flex flex-wrap items-center gap-1.5 text-sm text-muted" aria-label="Breadcrumb">
          <Link href="/library" className="hover:text-accent">
            Thư viện
          </Link>
          {domain && (
            <>
              <span aria-hidden>›</span>
              <Link href={`/library#${article.domain}`} className="hover:text-accent">
                {domain.title}
              </Link>
            </>
          )}
          {category && category.id !== article.domain && (
            <>
              <span aria-hidden>·</span>
              <span>{category.title}</span>
            </>
          )}
        </nav>
        <h1 className="font-display text-3xl font-bold tracking-tight sm:text-[2.1rem]">{article.title}</h1>
        <div className="flex flex-wrap items-center gap-x-3 gap-y-2 text-sm text-muted">
          <StatusBadge status={status} />
          <span className="rounded border border-line px-1.5 py-0.5 font-mono text-[0.68rem] uppercase tracking-wide text-muted">{levelLabel[article.level]}</span>
          {article.status === 'draft' && <span className="rounded bg-warn-soft px-1.5 py-0.5 text-xs text-warn">Nháp</span>}
          {article.tags.map((t) => (
            <span key={t} className="rounded bg-sunk px-1.5 py-0.5 text-xs">
              {t}
            </span>
          ))}
        </div>
        <div className="flex flex-wrap gap-2 pt-1">
          <button
            type="button"
            onClick={() => setStatus(slug, status === 'completed' ? 'learning' : 'completed')}
            className={`inline-flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium ${status === 'completed' ? 'bg-success-soft text-success' : 'bg-accent text-accent-ink hover:opacity-90'}`}
          >
            {status === 'completed' ? <RotateCcw className="size-4" /> : <Check className="size-4" />}
            {status === 'completed' ? 'Đánh dấu học lại' : 'Đánh dấu đã học'}
          </button>
          <button
            type="button"
            onClick={() => toggleBookmark(slug)}
            aria-pressed={bookmarked}
            className="inline-flex items-center gap-2 rounded-md border border-line bg-surface px-3 py-2 text-sm hover:border-accent"
          >
            <Bookmark className={`size-4 ${bookmarked ? 'text-warn' : ''}`} fill={bookmarked ? 'currentColor' : 'none'} />
            {bookmarked ? 'Đã bookmark' : 'Bookmark'}
          </button>
        </div>
      </div>

      <article className="article">
        <Markdown remarkPlugins={[remarkGfm]}>{article.content}</Markdown>
      </article>
    </div>
  );
}
