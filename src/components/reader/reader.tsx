'use client';

import Link from 'next/link';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ArrowLeft, ArrowRight, Bookmark, Check, ChevronDown, Info, NotebookPen, Paperclip, RotateCcw } from 'lucide-react';
import { getDoc, getDomain, getTopic, neighbours, tocHeadings, type Doc } from '@/lib/content';
import { isBookmarked, markOpened, recordReading, setStatus, statusOf, toggleBookmark, useLearning } from '@/lib/store';
import { GalleryView, HtmlFrame, MarkdownBody, PdfView, scrollToHeading, type BodyHandle } from './bodies';
import { Toc } from './toc';
import { NotesPanel } from '../notes';
import { KindIcon, LevelBadge, ProgressBar, StatusBadge } from '../ui';

const SPY_OFFSET = 110;

export function Reader({ slug, html }: { slug: string; html: string | null }) {
  const doc = getDoc(slug) as Doc;
  const learning = useLearning();
  const body = useRef<BodyHandle>(null);
  const content = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState<string | null>(null);
  const [readPct, setReadPct] = useState(0);
  const [notesOpen, setNotesOpen] = useState(false);
  const [bodyReady, setBodyReady] = useState(doc.kind !== 'html');

  const headings = useMemo(() => tocHeadings(doc), [doc]);
  const domain = getDomain(doc.domain);
  const topic = getTopic(doc.topic);
  const { prev, next } = neighbours(slug);
  const status = statusOf(learning, slug);
  const notes = learning.notes.filter((n) => n.docSlug === slug);
  const docBookmarked = isBookmarked(learning, slug, null);

  useEffect(() => {
    markOpened(slug);
  }, [slug]);

  // Mục lục sáng theo vị trí đọc + tiến độ đọc.
  useEffect(() => {
    let raf = 0;
    let lastSave = 0;
    const onScroll = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        let current: string | null = null;
        for (const h of headings) {
          const top = body.current?.locate(h.id);
          if (top == null) continue;
          if (top <= SPY_OFFSET) current = h.id;
          else break;
        }
        setActive(current ?? headings[0]?.id ?? null);

        const el = content.current;
        if (!el) return;
        const rect = el.getBoundingClientRect();
        const pct = Math.max(0, Math.min(1, (window.innerHeight - rect.top) / Math.max(rect.height, 1)));
        setReadPct(pct);
        const now = Date.now();
        if (now - lastSave > 1500) {
          lastSave = now;
          recordReading(slug, pct);
        }
      });
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
    };
  }, [headings, slug, bodyReady]);

  // Nhảy tới mục từ #hash (mở từ tìm kiếm / bookmark) khi nội dung đã sẵn sàng.
  useEffect(() => {
    if (!bodyReady) return;
    const go = () => {
      const id = decodeURIComponent(window.location.hash.slice(1));
      if (!id) return;
      // Ảnh/iframe có thể làm layout thay đổi: thử lại vài lần.
      let tries = 0;
      const attempt = () => {
        if (scrollToHeading(body.current, id, false) && tries > 1) return;
        if (++tries < 4) setTimeout(attempt, 150 * tries);
      };
      attempt();
    };
    go();
    window.addEventListener('hashchange', go);
    window.addEventListener('go-anchor', go);
    return () => {
      window.removeEventListener('hashchange', go);
      window.removeEventListener('go-anchor', go);
    };
  }, [bodyReady, slug]);

  const jump = useCallback((id: string) => {
    history.replaceState(null, '', `#${id}`);
    scrollToHeading(body.current, id);
  }, []);

  const onHtmlReady = useCallback(() => setBodyReady(true), []);
  const compact = doc.kind === 'html';

  return (
    <div className="relative">
      <div className="fixed top-14 right-0 left-0 z-20 h-0.5" aria-hidden>
        <div className="h-full bg-accent transition-[width] duration-150" style={{ width: `${Math.round(readPct * 100)}%` }} />
      </div>

      <div className="mx-auto flex max-w-[88rem] gap-10 px-4 py-8 sm:px-8">
        <article className="min-w-0 flex-1">
          <header className={`flex flex-col gap-3 ${compact ? 'mb-6' : 'mb-10'} ${compact ? '' : 'max-w-[72ch]'}`}>
            <nav className="flex flex-wrap items-center gap-1.5 text-sm text-muted" aria-label="Breadcrumb">
              <Link href="/library" className="hover:text-accent">
                Thư viện
              </Link>
              <span aria-hidden>›</span>
              <Link href={`/library#${doc.domain}`} className="hover:text-accent">
                {domain?.title}
              </Link>
              <span aria-hidden>›</span>
              <span>{topic?.title}</span>
            </nav>
            <h1 className={`font-display font-bold tracking-tight ${compact ? 'text-2xl' : 'text-3xl sm:text-[2.1rem]'}`}>{doc.title}</h1>
            {doc.subtitle && <p className="text-ink-2">{doc.subtitle}</p>}
            <div className="flex flex-wrap items-center gap-x-3 gap-y-2 text-sm text-muted">
              <StatusBadge status={status} />
              <LevelBadge level={doc.level} />
              <span className="inline-flex items-center gap-1.5">
                <KindIcon kind={doc.kind} className="size-3.5" />
                {doc.kind === 'gallery' ? `${doc.stats.pages} trang ảnh` : doc.kind === 'pdf' ? 'PDF' : `${doc.stats.minutes} phút đọc`}
              </span>
              {doc.stats.codeBlocks ? <span>{doc.stats.codeBlocks} đoạn code</span> : null}
              {doc.tags.includes('interview') && <span className="rounded bg-warn-soft px-1.5 py-0.5 text-xs text-warn">Phỏng vấn</span>}
            </div>
            <div className="flex flex-wrap gap-2 pt-1">
              <button
                type="button"
                onClick={() => setStatus(slug, status === 'completed' ? 'learning' : 'completed')}
                className={`inline-flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium ${
                  status === 'completed' ? 'bg-success-soft text-success' : 'bg-accent text-accent-ink hover:opacity-90'
                }`}
              >
                {status === 'completed' ? <RotateCcw className="size-4" /> : <Check className="size-4" />}
                {status === 'completed' ? 'Đánh dấu học lại' : 'Đánh dấu đã học'}
              </button>
              <button
                type="button"
                onClick={() => toggleBookmark(slug)}
                aria-pressed={docBookmarked}
                className="inline-flex items-center gap-2 rounded-md border border-line bg-surface px-3 py-2 text-sm hover:border-accent"
              >
                <Bookmark className={`size-4 ${docBookmarked ? 'text-warn' : ''}`} fill={docBookmarked ? 'currentColor' : 'none'} />
                {docBookmarked ? 'Đã bookmark' : 'Bookmark'}
              </button>
              <button
                type="button"
                onClick={() => setNotesOpen(true)}
                className="inline-flex items-center gap-2 rounded-md border border-line bg-surface px-3 py-2 text-sm hover:border-accent"
              >
                <NotebookPen className="size-4" /> Ghi chú{notes.length ? ` (${notes.length})` : ''}
              </button>
              {doc.attachments.map((a) => (
                <a
                  key={a.url}
                  href={a.url}
                  target="_blank"
                  rel="noopener"
                  className="inline-flex items-center gap-2 rounded-md border border-line bg-surface px-3 py-2 text-sm hover:border-accent"
                >
                  <Paperclip className="size-4" /> {a.label}
                </a>
              ))}
            </div>
            {doc.note && (
              <p className="flex items-start gap-2 rounded-md bg-warn-soft px-3 py-2 text-sm text-warn">
                <Info className="mt-0.5 size-4 shrink-0" /> {doc.note}
              </p>
            )}
          </header>

          {headings.length > 0 && (
            <details className="mb-8 rounded-lg border border-line bg-surface xl:hidden">
              <summary className="flex cursor-pointer list-none items-center justify-between px-4 py-3 text-sm font-medium">
                Mục lục ({headings.length}) <ChevronDown className="size-4 text-muted" />
              </summary>
              <div className="max-h-[50vh] overflow-y-auto px-3 pb-3">
                <Toc slug={slug} headings={headings} active={active} onJump={jump} />
              </div>
            </details>
          )}

          <div ref={content}>
            {doc.kind === 'markdown' && html != null && <MarkdownBody ref={body} html={html} />}
            {doc.kind === 'html' && <HtmlFrame ref={body} doc={doc} onReady={onHtmlReady} />}
            {doc.kind === 'pdf' && <PdfView ref={body} doc={doc} />}
            {doc.kind === 'gallery' && <GalleryView ref={body} doc={doc} />}
          </div>

          <footer className={`mt-16 flex flex-col gap-8 border-t border-line pt-8 ${compact ? '' : 'max-w-[72ch]'}`}>
            {status !== 'completed' && (
              <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg bg-accent-soft px-4 py-3">
                <span className="text-sm">Đọc xong bài này?</span>
                <button type="button" onClick={() => setStatus(slug, 'completed')} className="inline-flex items-center gap-2 rounded-md bg-accent px-3 py-2 text-sm font-medium text-accent-ink">
                  <Check className="size-4" /> Đánh dấu đã học
                </button>
              </div>
            )}

            {doc.related.length > 0 && (
              <section className="flex flex-col gap-3">
                <h2 className="eyebrow">Tài liệu liên quan</h2>
                <ul className="grid gap-2 sm:grid-cols-2">
                  {doc.related.map((s) => {
                    const r = getDoc(s);
                    if (!r) return null;
                    return (
                      <li key={s}>
                        <Link href={`/learn/${s}`} className="flex h-full items-start gap-2 rounded-lg border border-line bg-surface px-3 py-2.5 text-sm hover:border-accent">
                          <KindIcon kind={r.kind} className="mt-0.5 size-4 text-muted" />
                          <span className="flex flex-col">
                            <span className="font-medium">{r.title}</span>
                            <span className="text-xs text-muted">{getTopic(r.topic)?.title}</span>
                          </span>
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </section>
            )}

            <nav className="grid gap-3 sm:grid-cols-2" aria-label="Bài trước và bài tiếp">
              {prev ? (
                <Link href={`/learn/${prev.slug}`} className="flex flex-col gap-1 rounded-lg border border-line bg-surface px-4 py-3 hover:border-accent">
                  <span className="flex items-center gap-1 text-xs text-muted">
                    <ArrowLeft className="size-3.5" /> Bài trước
                  </span>
                  <span className="font-medium">{prev.title}</span>
                </Link>
              ) : (
                <span />
              )}
              {next && (
                <Link href={`/learn/${next.slug}`} className="flex flex-col items-end gap-1 rounded-lg border border-line bg-surface px-4 py-3 text-right hover:border-accent">
                  <span className="flex items-center gap-1 text-xs text-muted">
                    Bài tiếp <ArrowRight className="size-3.5" />
                  </span>
                  <span className="font-medium">{next.title}</span>
                </Link>
              )}
            </nav>
          </footer>
        </article>

        {headings.length > 0 && (
          <aside className="sticky top-20 hidden max-h-[calc(100dvh-6rem)] w-60 shrink-0 self-start overflow-y-auto pb-6 xl:block" aria-label="Mục lục">
            <div className="flex flex-col gap-3">
              <div className="eyebrow">Trên trang này</div>
              <Toc slug={slug} headings={headings} active={active} onJump={jump} />
              <div className="mt-2 flex flex-col gap-1.5 border-t border-line pt-3 text-xs text-muted">
                <span className="tabular">Đã đọc {Math.round(Math.max(readPct, learning.progress[slug]?.readPct ?? 0) * 100)}%</span>
                <ProgressBar value={Math.round(Math.max(readPct, learning.progress[slug]?.readPct ?? 0) * 100)} />
              </div>
            </div>
          </aside>
        )}
      </div>

      <NotesPanel open={notesOpen} onClose={() => setNotesOpen(false)} docSlug={slug} headings={headings} notes={notes} activeSection={active} />
    </div>
  );
}
