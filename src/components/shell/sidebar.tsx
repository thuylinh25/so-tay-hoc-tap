'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Bookmark, BrainCircuit, ChevronRight, GraduationCap, Home, Layers, Library, Map, MessagesSquare, NotebookPen } from 'lucide-react';
import { domains, docsInDomain } from '@/lib/content';
import { percentDone, statusOf, useLearning } from '@/lib/store';
import { StatusIcon } from '../ui';

export const navItems = [
  { href: '/', label: 'Trang chủ', icon: Home },
  { href: '/library', label: 'Thư viện', icon: Library },
  { href: '/roadmaps', label: 'Lộ trình', icon: Map },
  { href: '/bookmarks', label: 'Bookmark', icon: Bookmark },
  { href: '/notes', label: 'Ghi chú', icon: NotebookPen },
  { href: '/flashcards', label: 'Flashcards', icon: Layers, soon: true },
  { href: '/quiz', label: 'Quiz', icon: GraduationCap, soon: true },
  { href: '/interview', label: 'Phỏng vấn', icon: MessagesSquare, soon: true },
] as const;

const OPEN_KEY = 'so-tay-tree-open';

export function Sidebar() {
  const pathname = usePathname();
  const learning = useLearning();
  const activeSlug = pathname.startsWith('/learn/') ? decodeURIComponent(pathname.split('/')[2] ?? '') : null;
  const activeDomain = activeSlug ? docsInDomainOf(activeSlug) : null;
  const [open, setOpen] = useState<Record<string, boolean>>({});

  useEffect(() => {
    try {
      setOpen(JSON.parse(localStorage.getItem(OPEN_KEY) ?? '{}'));
    } catch {}
  }, []);

  const toggle = (id: string) =>
    setOpen((o) => {
      const next = { ...o, [id]: !isOpen(o, id) };
      try {
        localStorage.setItem(OPEN_KEY, JSON.stringify(next));
      } catch {}
      return next;
    });
  const isOpen = (o: Record<string, boolean>, id: string) => o[id] ?? id === activeDomain;

  return (
    <nav className="flex flex-col gap-6 px-3 py-4 text-sm" aria-label="Điều hướng chính">
      <ul className="flex flex-col gap-0.5">
        {navItems.map((item) => {
          const active = item.href === '/' ? pathname === '/' : pathname.startsWith(item.href);
          const Icon = item.icon;
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                className={`flex items-center gap-2.5 rounded-md px-2.5 py-2 ${active ? 'bg-accent-soft font-medium text-accent' : 'text-ink-2 hover:bg-sunk hover:text-ink'}`}
                aria-current={active ? 'page' : undefined}
              >
                <Icon className="size-4 shrink-0" aria-hidden />
                <span className="flex-1">{item.label}</span>
                {'soon' in item && <span className="rounded bg-sunk px-1.5 py-0.5 text-[0.65rem] text-muted">Sắp có</span>}
              </Link>
            </li>
          );
        })}
      </ul>

      <div className="flex flex-col gap-1">
        <div className="eyebrow flex items-center gap-2 px-2.5 pb-1">
          <BrainCircuit className="size-3.5" aria-hidden /> Chủ đề
        </div>
        <ul className="flex flex-col gap-0.5">
          {domains.map((dm) => {
            const list = docsInDomain(dm.id);
            const expanded = isOpen(open, dm.id);
            const pct = percentDone(
              learning,
              list.map((d) => d.slug),
            );
            return (
              <li key={dm.id}>
                <button
                  type="button"
                  onClick={() => toggle(dm.id)}
                  aria-expanded={expanded}
                  className="flex w-full items-center gap-2 rounded-md px-2.5 py-1.5 text-left text-ink-2 hover:bg-sunk hover:text-ink"
                >
                  <ChevronRight className={`size-3.5 shrink-0 text-muted transition-transform ${expanded ? 'rotate-90' : ''}`} aria-hidden />
                  <span className="flex-1 font-medium">{dm.title}</span>
                  <span className="tabular text-xs text-muted">{pct > 0 ? `${pct}%` : list.length}</span>
                </button>
                {expanded && (
                  <ul className="mb-1 ml-[1.05rem] flex flex-col gap-0.5 border-l border-line pl-2">
                    {list.map((d) => {
                      const active = d.slug === activeSlug;
                      return (
                        <li key={d.slug}>
                          <Link
                            href={`/learn/${d.slug}`}
                            className={`flex items-start gap-2 rounded-md px-2 py-1.5 ${active ? 'bg-accent-soft text-accent' : 'text-ink-2 hover:bg-sunk hover:text-ink'}`}
                            aria-current={active ? 'page' : undefined}
                          >
                            <StatusIcon status={statusOf(learning, d.slug)} className="mt-0.5 size-3.5 shrink-0" />
                            <span className="leading-snug">{d.title}</span>
                          </Link>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </li>
            );
          })}
        </ul>
      </div>
    </nav>
  );
}

function docsInDomainOf(slug: string) {
  return domains.find((dm) => docsInDomain(dm.id).some((d) => d.slug === slug))?.id ?? null;
}
