'use client';

import { Bookmark } from 'lucide-react';
import type { Heading } from '@/lib/content';
import { isBookmarked, toggleBookmark, useLearning } from '@/lib/store';

interface Props {
  slug: string;
  headings: Heading[];
  active: string | null;
  onJump: (id: string) => void;
}

/**
 * Mục lục lồng 2 bậc. Bài dài (~70 mục) chỉ mở các mục con của phần đang đọc,
 * để mục lục không dài hơn màn hình.
 */
export function Toc({ slug, headings, active, onJump }: Props) {
  const learning = useLearning();
  const minDepth = Math.min(...headings.map((h) => h.depth));
  const long = headings.length > 24;

  // Nhóm đang đọc = heading bậc cao nhất gần nhất phía trên mục active.
  const activeIdx = headings.findIndex((h) => h.id === active);
  let groupStart = -1;
  for (let i = activeIdx; i >= 0; i--) {
    if (headings[i].depth === minDepth) {
      groupStart = i;
      break;
    }
  }

  let currentGroup = -1;
  return (
    <ul className="flex flex-col text-[0.83rem] leading-snug">
      {headings.map((h, i) => {
        if (h.depth === minDepth) currentGroup = i;
        const nested = h.depth > minDepth;
        if (long && nested && currentGroup !== groupStart) return null;
        const isActive = h.id === active;
        const marked = isBookmarked(learning, slug, h.id);
        return (
          <li key={h.id} className="group relative">
            <button
              type="button"
              onClick={() => onJump(h.id)}
              className={`block w-full border-l-2 py-1 pr-6 text-left ${nested ? 'pl-5' : 'pl-3'} ${
                isActive ? 'border-accent font-medium text-accent' : 'border-line text-muted hover:border-ink-2 hover:text-ink'
              }`}
              aria-current={isActive ? 'location' : undefined}
            >
              {h.text}
            </button>
            <button
              type="button"
              onClick={() => toggleBookmark(slug, h.id, h.text)}
              className={`absolute top-1 right-0 rounded p-0.5 ${marked ? 'text-warn' : 'text-muted opacity-0 group-hover:opacity-100 focus-visible:opacity-100'}`}
              aria-label={marked ? `Bỏ bookmark mục ${h.text}` : `Bookmark mục ${h.text}`}
              title={marked ? 'Bỏ bookmark mục này' : 'Bookmark mục này'}
            >
              <Bookmark className="size-3.5" fill={marked ? 'currentColor' : 'none'} />
            </button>
          </li>
        );
      })}
    </ul>
  );
}
