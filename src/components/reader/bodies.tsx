'use client';

import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react';
import { Download, ExternalLink } from 'lucide-react';
import type { Doc } from '@/lib/content';
import { resolvedTheme } from '../theme-toggle';

/** Mỗi kiểu thân bài tự biết vị trí heading của mình (HTML nhúng nằm trong iframe). */
export interface BodyHandle {
  /** Vị trí top (theo viewport) của heading, hoặc null nếu chưa có. */
  locate(id: string): number | null;
  element(id: string): HTMLElement | null;
}

const HEADER_OFFSET = 72;

export function scrollToHeading(body: BodyHandle | null, id: string, smooth = true) {
  const top = body?.locate(id);
  if (top == null) return false;
  window.scrollTo({ top: window.scrollY + top - HEADER_OFFSET, behavior: smooth ? 'smooth' : 'auto' });
  const el = body?.element(id);
  if (el) {
    el.classList.remove('flash');
    void el.offsetWidth;
    el.classList.add('flash');
  }
  return true;
}

// ---------- Markdown đã render sẵn lúc build ----------

export const MarkdownBody = forwardRef<BodyHandle, { html: string }>(function MarkdownBody({ html }, ref) {
  const root = useRef<HTMLDivElement>(null);

  useImperativeHandle(ref, () => {
    const element = (id: string) => root.current?.querySelector<HTMLElement>(`#${CSS.escape(id)}`) ?? null;
    return { element, locate: (id) => element(id)?.getBoundingClientRect().top ?? null };
  });

  useEffect(() => {
    const el = root.current;
    if (!el) return;
    el.querySelectorAll('pre').forEach((pre) => {
      if (pre.querySelector('.code-copy')) return;
      const code = pre.querySelector('code');
      const lang = /language-(\w+)/.exec(code?.className ?? '')?.[1];
      if (lang) {
        const tag = document.createElement('span');
        tag.className = 'code-lang';
        tag.textContent = lang;
        pre.appendChild(tag);
      }
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'code-copy';
      btn.textContent = 'Copy';
      btn.setAttribute('aria-label', 'Sao chép code');
      btn.addEventListener('click', async () => {
        const text = code?.innerText ?? '';
        try {
          await navigator.clipboard.writeText(text);
          btn.textContent = 'Đã chép';
        } catch {
          const range = document.createRange();
          range.selectNodeContents(code ?? pre);
          const sel = window.getSelection();
          sel?.removeAllRanges();
          sel?.addRange(range);
          btn.textContent = 'Đã chọn — Ctrl+C';
        }
        setTimeout(() => (btn.textContent = 'Copy'), 1600);
      });
      pre.appendChild(btn);
    });
  }, [html]);

  return <div ref={root} className="article" dangerouslySetInnerHTML={{ __html: html }} />;
});

// ---------- Trang HTML có thiết kế riêng, nhúng qua iframe cùng origin ----------

export const HtmlFrame = forwardRef<BodyHandle, { doc: Doc; onReady?: () => void }>(function HtmlFrame({ doc, onReady }, ref) {
  const frame = useRef<HTMLIFrameElement>(null);
  const [height, setHeight] = useState(1200);

  const headingEls = () => Array.from(frame.current?.contentDocument?.querySelectorAll<HTMLElement>('h2, h3') ?? []);
  const byId = (id: string) => {
    const h = doc.headings.find((x) => x.id === id);
    return h?.index != null ? headingEls()[h.index] ?? null : null;
  };

  useImperativeHandle(ref, () => ({
    element: byId,
    locate(id) {
      const el = byId(id);
      const f = frame.current;
      return el && f ? f.getBoundingClientRect().top + el.getBoundingClientRect().top : null;
    },
  }));

  useEffect(() => {
    const f = frame.current;
    if (!f) return;
    let ro: ResizeObserver | null = null;
    const syncTheme = () => {
      const d = f.contentDocument;
      if (d) d.documentElement.dataset.theme = resolvedTheme();
    };
    const mq = window.matchMedia('(prefers-color-scheme: dark)');

    const onLoad = () => {
      const d = f.contentDocument;
      if (!d) return;
      syncTheme();
      const measure = () => setHeight(d.documentElement.scrollHeight);
      measure();
      ro = new ResizeObserver(measure);
      ro.observe(d.body);
      // Link trong trang: #neo cuộn trang cha; link ngoài mở tab mới.
      d.addEventListener('click', (e) => {
        const a = (e.target as HTMLElement).closest('a');
        if (!a) return;
        const href = a.getAttribute('href') ?? '';
        if (href.startsWith('#')) {
          e.preventDefault();
          const target = d.getElementById(href.slice(1));
          if (target) window.scrollTo({ top: window.scrollY + f.getBoundingClientRect().top + target.getBoundingClientRect().top - HEADER_OFFSET, behavior: 'smooth' });
        } else if (/^https?:/.test(href)) {
          a.target = '_blank';
          a.rel = 'noopener noreferrer';
        }
      });
      onReady?.();
    };

    f.addEventListener('load', onLoad);
    if (f.contentDocument?.readyState === 'complete' && f.contentDocument.body?.childElementCount) onLoad();
    window.addEventListener('themechange', syncTheme);
    mq.addEventListener('change', syncTheme);
    return () => {
      f.removeEventListener('load', onLoad);
      window.removeEventListener('themechange', syncTheme);
      mq.removeEventListener('change', syncTheme);
      ro?.disconnect();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [doc.file]);

  return (
    <iframe
      ref={frame}
      src={doc.file}
      title={doc.title}
      className="block w-full rounded-lg border border-line bg-surface"
      style={{ height }}
      scrolling="no"
    />
  );
});

// ---------- PDF ----------

export const PdfView = forwardRef<BodyHandle, { doc: Doc }>(function PdfView({ doc }, ref) {
  useImperativeHandle(ref, () => ({ element: () => null, locate: () => null }));
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap gap-2">
        <a href={doc.file} target="_blank" rel="noopener" className="inline-flex items-center gap-2 rounded-md border border-line bg-surface px-3 py-2 text-sm hover:border-accent">
          <ExternalLink className="size-4" aria-hidden /> Mở PDF trong tab mới
        </a>
        <a href={doc.file} download className="inline-flex items-center gap-2 rounded-md border border-line bg-surface px-3 py-2 text-sm hover:border-accent">
          <Download className="size-4" aria-hidden /> Tải PDF
        </a>
      </div>
      <object data={doc.file} type="application/pdf" className="h-[80vh] w-full rounded-lg border border-line bg-surface">
        <div className="flex flex-col items-start gap-2 p-6 text-sm text-muted">
          Trình duyệt này không hiển thị PDF ngay trong trang. Dùng nút “Mở PDF trong tab mới” hoặc “Tải PDF” ở trên.
        </div>
      </object>
      {doc.questions && doc.questions.length > 0 && (
        <section className="flex flex-col gap-3">
          <h2 className="font-display text-lg font-semibold">Các câu hỏi trong tài liệu</h2>
          <ol className="flex flex-col gap-2 text-sm">
            {doc.questions.map((q) => (
              <li key={q} className="rounded-md border border-line bg-surface px-3 py-2">
                {q}
              </li>
            ))}
          </ol>
        </section>
      )}
    </div>
  );
});

// ---------- Sổ tay dạng ảnh ----------

export const GalleryView = forwardRef<BodyHandle, { doc: Doc }>(function GalleryView({ doc }, ref) {
  useImperativeHandle(ref, () => ({
    element: (id) => document.getElementById(id),
    locate: (id) => document.getElementById(id)?.getBoundingClientRect().top ?? null,
  }));
  return (
    <div className="flex flex-col gap-10">
      {doc.pages?.map((p) => (
        <figure key={p.id} id={p.id} className="flex scroll-mt-20 flex-col gap-2">
          <figcaption className="flex items-baseline justify-between text-sm">
            <span className="font-display font-semibold">{p.label}</span>
            <a href={p.src} target="_blank" rel="noopener" className="text-xs text-muted hover:text-accent">
              Xem ảnh gốc ↗
            </a>
          </figcaption>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={p.src}
            alt={`${doc.title} — ${p.label}`}
            width={p.width}
            height={p.height}
            loading={p.n <= 2 ? 'eager' : 'lazy'}
            decoding="async"
            className="h-auto w-full rounded-lg border border-line bg-surface"
          />
        </figure>
      ))}
    </div>
  );
});
