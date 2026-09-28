'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useCallback, useEffect, useState, type ReactNode } from 'react';
import { BookMarked, Menu, PanelLeftClose, PanelLeftOpen, Search, X } from 'lucide-react';
import { Sidebar } from './sidebar';
import { SearchDialog } from '../search-dialog';
import { ThemeToggle } from '../theme-toggle';

const COLLAPSE_KEY = 'so-tay-sidebar-collapsed';

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const [drawer, setDrawer] = useState(false);
  const [search, setSearch] = useState(false);
  const [isMac, setIsMac] = useState(false);

  useEffect(() => {
    setIsMac(/Mac|iPhone|iPad/.test(navigator.platform));
    try {
      setCollapsed(localStorage.getItem(COLLAPSE_KEY) === '1');
    } catch {}
  }, []);

  useEffect(() => setDrawer(false), [pathname]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setSearch((s) => !s);
      }
    };
    const onOpen = () => setSearch(true);
    window.addEventListener('keydown', onKey);
    window.addEventListener('open-search', onOpen);
    return () => {
      window.removeEventListener('keydown', onKey);
      window.removeEventListener('open-search', onOpen);
    };
  }, []);

  useEffect(() => {
    document.body.style.overflow = drawer ? 'hidden' : '';
  }, [drawer]);

  const toggleCollapsed = () =>
    setCollapsed((c) => {
      try {
        localStorage.setItem(COLLAPSE_KEY, c ? '0' : '1');
      } catch {}
      return !c;
    });

  const closeSearch = useCallback(() => setSearch(false), []);

  return (
    <div className="min-h-dvh">
      <header className="sticky top-[env(safe-area-inset-top,0px)] z-30 flex h-14 items-center gap-2 border-b border-line bg-bg/90 px-3 backdrop-blur sm:px-4">
        <button
          type="button"
          onClick={() => setDrawer(true)}
          className="grid size-9 place-items-center rounded-md text-muted hover:bg-sunk hover:text-ink lg:hidden"
          aria-label="Mở menu"
        >
          <Menu className="size-5" />
        </button>
        <button
          type="button"
          onClick={toggleCollapsed}
          className="hidden size-9 place-items-center rounded-md text-muted hover:bg-sunk hover:text-ink lg:grid"
          aria-label={collapsed ? 'Mở thanh bên' : 'Thu gọn thanh bên'}
          title={collapsed ? 'Mở thanh bên' : 'Thu gọn thanh bên'}
        >
          {collapsed ? <PanelLeftOpen className="size-[18px]" /> : <PanelLeftClose className="size-[18px]" />}
        </button>
        <Link href="/" className="flex items-center gap-2 font-display font-bold tracking-tight">
          <BookMarked className="size-5 text-accent" aria-hidden />
          <span>Sổ tay học tập</span>
        </Link>
        <div className="flex-1" />
        <button
          type="button"
          onClick={() => setSearch(true)}
          className="flex h-9 items-center gap-2 rounded-md border border-line bg-surface px-3 text-sm text-muted hover:border-accent hover:text-ink sm:w-64"
          aria-label="Tìm kiếm"
        >
          <Search className="size-4" aria-hidden />
          <span className="hidden flex-1 text-left sm:inline">Tìm kiếm…</span>
          <kbd className="hidden rounded border border-line px-1.5 font-mono text-[0.68rem] sm:inline">{isMac ? '⌘' : 'Ctrl'} K</kbd>
        </button>
        <ThemeToggle />
      </header>

      <div className="flex">
        <aside
          className={`sticky top-14 hidden h-[calc(100dvh-3.5rem)] w-68 shrink-0 overflow-y-auto border-r border-line bg-bg ${collapsed ? '' : 'lg:block'}`}
          aria-label="Thanh bên"
        >
          <Sidebar />
        </aside>

        {drawer && (
          <div className="fixed inset-0 z-40 lg:hidden">
            <div className="absolute inset-0 bg-ink/30" onClick={() => setDrawer(false)} />
            <aside className="absolute inset-y-0 left-0 flex w-[min(20rem,85vw)] flex-col overflow-y-auto bg-surface pb-[env(safe-area-inset-bottom,0px)] shadow-pop">
              <div className="flex h-14 items-center justify-between border-b border-line px-4 pt-[env(safe-area-inset-top,0px)]">
                <span className="font-display font-bold">Sổ tay học tập</span>
                <button type="button" onClick={() => setDrawer(false)} className="grid size-9 place-items-center rounded-md text-muted hover:bg-sunk" aria-label="Đóng menu">
                  <X className="size-5" />
                </button>
              </div>
              <Sidebar />
            </aside>
          </div>
        )}

        <main className="min-w-0 flex-1">{children}</main>
      </div>

      <SearchDialog open={search} onClose={closeSearch} />
    </div>
  );
}
