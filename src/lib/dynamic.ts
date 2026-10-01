'use client';

// Lớp dữ liệu runtime cho bài viết tạo từ web (D1). Bài static vẫn nằm trong manifest tĩnh;
// lớp này fetch /api/articles rồi gộp vào danh sách để Library/Sidebar/Search hiển thị — KHÔNG build lại.
// Bài động gắn vào domain sẵn có + một topic ảo "Bài viết mới" (id = `__web__<domain>`) để cây taxonomy đồng nhất.
import { useCallback, useSyncExternalStore } from 'react';
import {
  categories as staticCategories,
  docs as staticDocs,
  domains as staticDomains,
  topics as staticTopics,
  type Doc,
  type Level,
  type Topic,
} from './content';

export const WEB_TOPIC_PREFIX = '__web__';
const WEB_TOPIC_TITLE = 'Bài viết mới';

export interface DynArticle {
  id: string;
  slug: string;
  title: string;
  domain: string;
  category: string;
  tags: string[];
  level: Level;
  status: 'draft' | 'published';
  content?: string;
  createdAt: number;
  updatedAt: number;
}

const WORDS_PER_MIN = 200;

/** Chuẩn hoá bài động về cùng shape Doc để tái dùng mọi component hiện có. */
export function articleToDoc(a: DynArticle): Doc {
  const words = a.content ? (a.content.match(/\S+/g)?.length ?? 0) : 0;
  return {
    slug: a.slug,
    title: a.title,
    subtitle: null,
    category: a.category,
    domain: a.domain,
    topic: `${WEB_TOPIC_PREFIX}${a.domain}`,
    level: a.level,
    tags: a.tags,
    order: 100000 + a.createdAt / 1e9,
    source: '(web)',
    kind: 'markdown',
    related: [],
    note: null,
    headings: [],
    attachments: [],
    stats: words ? { words, minutes: Math.max(1, Math.round(words / WORDS_PER_MIN)) } : {},
  };
}

// ---------- store ----------

interface State {
  loaded: boolean;
  admin: boolean;
  articles: DynArticle[];
}

let state: State = { loaded: false, admin: false, articles: [] };
let fetching = false;
const listeners = new Set<() => void>();
const emit = () => listeners.forEach((l) => l());

async function fetchAll() {
  if (fetching || typeof window === 'undefined') return;
  fetching = true;
  try {
    const [meRes, artRes] = await Promise.all([fetch('/api/me', { credentials: 'same-origin' }), fetch('/api/articles', { credentials: 'same-origin' })]);
    const me = meRes.ok ? await meRes.json() : { admin: false };
    const art = artRes.ok ? await artRes.json() : { articles: [] };
    state = { loaded: true, admin: !!me.admin, articles: Array.isArray(art.articles) ? art.articles : [] };
  } catch {
    state = { ...state, loaded: true };
  } finally {
    fetching = false;
    emit();
  }
}

export function refreshDynamic() {
  fetching = false;
  return fetchAll();
}

function subscribe(l: () => void) {
  listeners.add(l);
  if (!state.loaded) fetchAll();
  return () => listeners.delete(l);
}

const getSnapshot = () => state;
const serverSnapshot: State = { loaded: false, admin: false, articles: [] };

export function useDynamicState(): State {
  return useSyncExternalStore(subscribe, getSnapshot, () => serverSnapshot);
}

/** True nếu đang đăng nhập admin (dùng để hiện nút tạo bài — bảo vệ thật nằm ở server). */
export function useIsAdmin(): boolean {
  return useDynamicState().admin;
}

// ---------- taxonomy đã gộp (static + bài động published) ----------

export interface MergedContent {
  categories: typeof staticCategories;
  domainsInCategory: (categoryId: string) => typeof staticDomains;
  topicsInDomain: (domainId: string) => Topic[];
  docsInTopic: (topicId: string) => Doc[];
  docsInDomain: (domainId: string) => Doc[];
  docsInCategory: (categoryId: string) => Doc[];
  docs: Doc[];
}

export function useMergedContent(): MergedContent {
  const { articles } = useDynamicState();

  return (() => {
    const dynDocs = articles.filter((a) => a.status === 'published').map(articleToDoc);
    const docs = [...staticDocs, ...dynDocs];

    // Topic ảo "Bài viết mới" cho mỗi domain có bài động.
    const webDomains = new Set(dynDocs.map((d) => d.domain));
    const webTopics: Topic[] = [...webDomains].map((domainId) => ({ id: `${WEB_TOPIC_PREFIX}${domainId}`, domain: domainId, title: WEB_TOPIC_TITLE }));
    const topics = [...staticTopics, ...webTopics];

    const docsInTopic = (topicId: string) => docs.filter((d) => d.topic === topicId);
    const docsInDomain = (domainId: string) => docs.filter((d) => d.domain === domainId);
    const docsInCategory = (categoryId: string) => docs.filter((d) => d.category === categoryId);
    const topicsInDomain = (domainId: string) => topics.filter((t) => t.domain === domainId);
    const domainsInCategory = (categoryId: string) => staticDomains.filter((d) => d.category === categoryId);

    return { categories: staticCategories, domainsInCategory, topicsInDomain, docsInTopic, docsInDomain, docsInCategory, docs };
  })();
}

/** Bài động dạng entry cho chỉ mục tìm kiếm (title/tags/category). */
export function useSearchExtras() {
  const { articles } = useDynamicState();
  return useCallback(() => articles.filter((a) => a.status === 'published'), [articles]);
}
