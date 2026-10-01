'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Bookmark, BrainCircuit, ChevronRight, GraduationCap, Home, Layers, Library, Map, MessagesSquare, NotebookPen } from 'lucide-react';
import { categories, docsInCategory, docsInDomain, docsInTopic, domainsInCategory, getDoc, topicsInDomain, type Doc } from '@/lib/content';
import { percentDone, statusOf, useLearning } from '@/lib/store';
import { StatusIcon } from '../ui';

export const navItems = [
  { href: '/', label: 'Trang chủ', icon: Home },
  { href: '/library', label: 'Thư viện', icon: Library },
  { href: '/roadmaps', label: 'Lộ trình', icon: Map },
  { href: '/bookmarks', label: 'Bookmark', icon: Bookmark },
  { href: '/notes', label: 'Ghi chú', icon: NotebookPen },
  { href: '/flashcards', label: 'Flashcards', icon: Layers },
  { href: '/quiz', label: 'Quiz', icon: GraduationCap },
  { href: '/interview', label: 'Phỏng vấn', icon: MessagesSquare },
] as const;

const OPEN_KEY = 'so-tay-tree-open';
const SUBLIST = 'mb-1 ml-[1.05rem] flex flex-col gap-0.5 border-l border-line pl-2';

export function Sidebar() {
  const pathname = usePathname();
  const learning = useLearning();
  const activeSlug = pathname.startsWith('/learn/') ? decodeURIComponent(pathname.split('/')[2] ?? '') : null;
  const activeDoc = activeSlug ? getDoc(activeSlug) : undefined;
  // Mọi nhánh chứa bài đang mở sẽ tự bung (trừ khi người dùng đã tự đóng).
  const activeTrail = new Set<string>(activeDoc ? [activeDoc.category, activeDoc.domain, activeDoc.topic] : []);
  const [open, setOpen] = useState<Record<string, boolean>>({});

  useEffect(() => {
    try {
      setOpen(JSON.parse(localStorage.getItem(OPEN_KEY) ?? '{}'));
    } catch {}
  }, []);

  const isOpen = (id: string) => open[id] ?? activeTrail.has(id);
  const toggle = (id: string) =>
    setOpen((o) => {
      const next = { ...o, [id]: !(o[id] ?? activeTrail.has(id)) };
      try {
        localStorage.setItem(OPEN_KEY, JSON.stringify(next));
      } catch {}
      return next;
    });

  function DocLink({ d }: { d: Doc }) {
    const active = d.slug === activeSlug;
    return (
      <li>
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
  }

  function Row({ id, title, slugs, weight }: { id: string; title: string; slugs: string[]; weight: string }) {
    const expanded = isOpen(id);
    const pct = percentDone(learning, slugs);
    return (
      <button
        type="button"
        onClick={() => toggle(id)}
        aria-expanded={expanded}
        className="flex w-full items-center gap-2 rounded-md px-2.5 py-1.5 text-left text-ink-2 hover:bg-sunk hover:text-ink"
      >
        <ChevronRight className={`size-3.5 shrink-0 text-muted transition-transform ${expanded ? 'rotate-90' : ''}`} aria-hidden />
        <span className={`flex-1 ${weight}`}>{title}</span>
        <span className="tabular text-xs text-muted">{pct > 0 ? `${pct}%` : slugs.length}</span>
      </button>
    );
  }

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
          {categories.map((cat) => {
            const catDocs = docsInCategory(cat.id);
            if (!catDocs.length) return null;
            return (
              <li key={cat.id}>
                <Row id={cat.id} title={cat.title} slugs={catDocs.map((d) => d.slug)} weight="font-semibold" />
                {isOpen(cat.id) && cat.layout === 'flat' && (
                  <ul className={SUBLIST}>
                    {catDocs.map((d) => (
                      <DocLink key={d.slug} d={d} />
                    ))}
                  </ul>
                )}
                {isOpen(cat.id) && cat.layout !== 'flat' && (
                  <ul className={SUBLIST}>
                    {domainsInCategory(cat.id).map((dm) => {
                      const dmDocs = docsInDomain(dm.id);
                      if (!dmDocs.length) return null;
                      return (
                        <li key={dm.id}>
                          <Row id={dm.id} title={dm.title} slugs={dmDocs.map((d) => d.slug)} weight="font-medium" />
                          {isOpen(dm.id) && (
                            <ul className={SUBLIST}>
                              {topicsInDomain(dm.id).map((t) => {
                                const tDocs = docsInTopic(t.id);
                                if (!tDocs.length) return null;
                                return (
                                  <li key={t.id}>
                                    <Row id={t.id} title={t.title} slugs={tDocs.map((d) => d.slug)} weight="" />
                                    {isOpen(t.id) && (
                                      <ul className={SUBLIST}>
                                        {tDocs.map((d) => (
                                          <DocLink key={d.slug} d={d} />
                                        ))}
                                      </ul>
                                    )}
                                  </li>
                                );
                              })}
                            </ul>
                          )}
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
