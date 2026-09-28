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

/** Trạng thái một câu hỏi: lịch flashcard (SM-2 rút gọn) + thống kê đúng/sai từ quiz và phỏng vấn. */
export interface QaState {
  due?: number;
  /** Khoảng cách ôn, tính bằng ngày. */
  ivl?: number;
  ease?: number;
  reps?: number;
  seen: number;
  right: number;
}

export type Rating = 'again' | 'hard' | 'good' | 'easy';

export interface PracticeSession {
  kind: 'quiz' | 'interview';
  at: number;
  scope: string;
  total: number;
  right: number;
}

export interface LearningState {
  v: 1;
  progress: Record<string, DocProgress>;
  bookmarks: Bookmark[];
  notes: Note[];
  /** Các ngày có học (YYYY-MM-DD, giờ địa phương) để tính chuỗi ngày học. */
  days: string[];
  qa: Record<string, QaState>;
  sessions: PracticeSession[];
}

const KEY = 'so-tay-hoc-tap:v1';
const EMPTY: LearningState = { v: 1, progress: {}, bookmarks: [], notes: [], days: [], qa: {}, sessions: [] };

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

// ---------- ôn tập ----------

const DAY = 86_400_000;

/** Khoảng ôn tiếp theo (ngày) nếu chấm `r`; 0 = ôn lại ngay trong lượt này. */
export function nextInterval(q: QaState | undefined, r: Rating) {
  const ivl = q?.ivl ?? 0;
  const ease = q?.ease ?? 2.5;
  const reps = q?.reps ?? 0;
  if (r === 'again') return 0;
  if (r === 'hard') return Math.max(1, Math.round(ivl * 1.2));
  const good = reps === 0 ? 1 : reps === 1 ? 3 : Math.round(ivl * ease);
  return r === 'good' ? good : Math.round(Math.max(good, 2) * 1.3);
}

export function reviewCard(id: string, r: Rating) {
  update((s) => {
    const q = s.qa[id];
    const ivl = nextInterval(q, r);
    const ease = Math.max(1.3, (q?.ease ?? 2.5) + { again: -0.2, hard: -0.15, good: 0, easy: 0.15 }[r]);
    const next: QaState = {
      seen: q?.seen ?? 0,
      right: q?.right ?? 0,
      ivl,
      ease,
      reps: r === 'again' ? 0 : (q?.reps ?? 0) + 1,
      due: Date.now() + (ivl === 0 ? 60_000 : ivl * DAY),
    };
    return { ...s, days: touchDay(s), qa: { ...s.qa, [id]: next } };
  });
}

/** Ghi kết quả một câu trong quiz/phỏng vấn. Câu trả lời sai được đưa vào flashcard, đến hạn ngay. */
export function recordAnswer(id: string, correct: boolean) {
  update((s) => {
    const q = s.qa[id] ?? { seen: 0, right: 0 };
    const next: QaState = { ...q, seen: q.seen + 1, right: q.right + (correct ? 1 : 0) };
    if (!correct) Object.assign(next, { due: Date.now(), ivl: 0, reps: 0 });
    return { ...s, qa: { ...s.qa, [id]: next } };
  });
}

export function saveSession(session: Omit<PracticeSession, 'at'>) {
  update((s) => ({ ...s, days: touchDay(s), sessions: [...s.sessions.slice(-49), { ...session, at: Date.now() }] }));
}
