'use client';

// Tiến độ học, bookmark và ghi chú, lưu trong localStorage của trình duyệt.
// Mọi thay đổi đi qua update(), nên sau này có thể thay bằng database mà không phải sửa giao diện.
import { useSyncExternalStore } from 'react';

export type Status = 'not-started' | 'learning' | 'completed';

export interface DocProgress {
  status: Exclude<Status, 'not-started'>;
  lastOpened: number;
  readPct: number;
  completedAt?: number;
}

export interface Bookmark {
  id: string;
  docSlug: string;
  sectionId: string | null;
  sectionTitle: string | null;
  createdAt: number;
}

export interface Note {
  id: string;
  docSlug: string;
  sectionId: string | null;
  sectionTitle: string | null;
  body: string;
  createdAt: number;
  updatedAt: number;
}

export interface LearningState {
  v: 1;
  progress: Record<string, DocProgress>;
  bookmarks: Bookmark[];
  notes: Note[];
  /** Các ngày có học (YYYY-MM-DD, giờ địa phương) để tính chuỗi ngày học. */
  days: string[];
}

const KEY = 'so-tay-hoc-tap:v1';
const EMPTY: LearningState = { v: 1, progress: {}, bookmarks: [], notes: [], days: [] };

let state: LearningState = EMPTY;
let loaded = false;
const listeners = new Set<() => void>();

function load() {
  if (loaded || typeof window === 'undefined') return;
  loaded = true;
  try {
    const raw = window.localStorage.getItem(KEY);
    if (raw) state = { ...EMPTY, ...JSON.parse(raw) };
  } catch {
    state = EMPTY;
  }
}

function persist() {
  try {
    window.localStorage.setItem(KEY, JSON.stringify(state));
  } catch {
    // Trình duyệt chặn storage (chế độ riêng tư…): vẫn chạy trong phiên hiện tại.
  }
}

export function update(fn: (s: LearningState) => LearningState) {
  load();
  state = fn(state);
  persist();
  listeners.forEach((l) => l());
}

function subscribe(l: () => void) {
  listeners.add(l);
  const onStorage = (e: StorageEvent) => {
    if (e.key !== KEY) return;
    loaded = false;
    load();
    l();
  };
  window.addEventListener('storage', onStorage);
  return () => {
    listeners.delete(l);
    window.removeEventListener('storage', onStorage);
  };
}

function getSnapshot() {
  load();
  return state;
}

export function useLearning(): LearningState {
  return useSyncExternalStore(subscribe, getSnapshot, () => EMPTY);
}

// ---------- selectors ----------

export const statusOf = (s: LearningState, slug: string): Status => s.progress[slug]?.status ?? 'not-started';

export function isBookmarked(s: LearningState, slug: string, sectionId: string | null = null) {
  return s.bookmarks.some((b) => b.docSlug === slug && b.sectionId === sectionId);
}

export function percentDone(s: LearningState, slugs: string[]) {
  if (!slugs.length) return 0;
  const score = slugs.reduce((n, slug) => {
    const p = s.progress[slug];
    if (!p) return n;
    return n + (p.status === 'completed' ? 1 : Math.min(p.readPct, 0.95) * 0.9);
  }, 0);
  return Math.round((score / slugs.length) * 100);
}

const dayKey = (d = new Date()) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

export function streak(s: LearningState) {
  const days = new Set(s.days);
  const d = new Date();
  if (!days.has(dayKey(d))) d.setDate(d.getDate() - 1); // chưa học hôm nay thì chuỗi tính tới hôm qua
  let n = 0;
  while (days.has(dayKey(d))) {
    n++;
    d.setDate(d.getDate() - 1);
  }
  return n;
}

// ---------- actions ----------

const uid = () => Math.random().toString(36).slice(2, 10) + Date.now().toString(36);

function touchDay(s: LearningState): string[] {
  const today = dayKey();
  return s.days.includes(today) ? s.days : [...s.days.slice(-400), today];
}

export function markOpened(slug: string) {
  update((s) => {
    const p = s.progress[slug];
    return {
      ...s,
      days: touchDay(s),
      progress: { ...s.progress, [slug]: { status: p?.status ?? 'learning', readPct: p?.readPct ?? 0, completedAt: p?.completedAt, lastOpened: Date.now() } },
    };
  });
}

export function recordReading(slug: string, pct: number) {
  const p = getSnapshot().progress[slug];
  if (!p || pct <= p.readPct + 0.02) return;
  update((s) => ({ ...s, progress: { ...s.progress, [slug]: { ...s.progress[slug], readPct: Math.min(1, pct) } } }));
}

export function setStatus(slug: string, status: Status) {
  update((s) => {
    const progress = { ...s.progress };
    if (status === 'not-started') delete progress[slug];
    else
      progress[slug] = {
        lastOpened: progress[slug]?.lastOpened ?? Date.now(),
        readPct: status === 'completed' ? 1 : progress[slug]?.readPct ?? 0,
        status,
        completedAt: status === 'completed' ? Date.now() : undefined,
      };
    return { ...s, progress, days: status === 'completed' ? touchDay(s) : s.days };
  });
}

export function toggleBookmark(slug: string, sectionId: string | null = null, sectionTitle: string | null = null) {
  update((s) => {
    const exists = isBookmarked(s, slug, sectionId);
    return {
      ...s,
      bookmarks: exists
        ? s.bookmarks.filter((b) => !(b.docSlug === slug && b.sectionId === sectionId))
        : [{ id: uid(), docSlug: slug, sectionId, sectionTitle, createdAt: Date.now() }, ...s.bookmarks],
    };
  });
}

export function removeBookmark(id: string) {
  update((s) => ({ ...s, bookmarks: s.bookmarks.filter((b) => b.id !== id) }));
}

export function saveNote(input: { id?: string; docSlug: string; sectionId: string | null; sectionTitle: string | null; body: string }) {
  const now = Date.now();
  update((s) => {
    if (input.id) {
      return { ...s, notes: s.notes.map((n) => (n.id === input.id ? { ...n, ...input, id: n.id, updatedAt: now } : n)) };
    }
    return { ...s, days: touchDay(s), notes: [{ ...input, id: uid(), createdAt: now, updatedAt: now }, ...s.notes] };
  });
}

export function deleteNote(id: string) {
  update((s) => ({ ...s, notes: s.notes.filter((n) => n.id !== id) }));
}
