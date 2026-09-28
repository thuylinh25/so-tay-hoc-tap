'use client';

import { useEffect, useState } from 'react';
import { Monitor, Moon, Sun } from 'lucide-react';
import { THEME_KEY as KEY } from '@/lib/theme';

type Theme = 'system' | 'light' | 'dark';
const NEXT: Record<Theme, Theme> = { system: 'light', light: 'dark', dark: 'system' };
const LABEL: Record<Theme, string> = { system: 'Theo hệ thống', light: 'Sáng', dark: 'Tối' };

export function applyTheme(theme: Theme) {
  const root = document.documentElement;
  if (theme === 'system') delete root.dataset.theme;
  else root.dataset.theme = theme;
  window.dispatchEvent(new Event('themechange'));
}

/** Theme đang hiển thị thật sự (đã tính cả chế độ hệ thống). */
export function resolvedTheme(): 'light' | 'dark' {
  const t = document.documentElement.dataset.theme;
  if (t === 'light' || t === 'dark') return t;
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

export function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>('system');

  useEffect(() => {
    try {
      const t = localStorage.getItem(KEY);
      if (t === 'light' || t === 'dark') setTheme(t);
    } catch {}
  }, []);

  const cycle = () => {
    const next = NEXT[theme];
    setTheme(next);
    applyTheme(next);
    try {
      if (next === 'system') localStorage.removeItem(KEY);
      else localStorage.setItem(KEY, next);
    } catch {}
  };

  const Icon = theme === 'light' ? Sun : theme === 'dark' ? Moon : Monitor;
  return (
    <button
      type="button"
      onClick={cycle}
      className="grid size-9 place-items-center rounded-md text-muted hover:bg-sunk hover:text-ink"
      title={`Giao diện: ${LABEL[theme]} (bấm để đổi)`}
      aria-label={`Giao diện: ${LABEL[theme]}. Bấm để đổi`}
    >
      <Icon className="size-[18px]" />
    </button>
  );
}
