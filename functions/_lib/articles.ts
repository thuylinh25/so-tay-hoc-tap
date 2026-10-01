// Logic dùng chung cho API bài viết động (D1).
import type { Env } from './auth';

export interface ArticleRow {
  id: string;
  slug: string;
  title: string;
  domain: string;
  category: string;
  tags: string; // JSON array (trong DB)
  level: string;
  content: string;
  status: string;
  createdAt: number;
  updatedAt: number;
}

export interface Article {
  id: string;
  slug: string;
  title: string;
  domain: string;
  category: string;
  tags: string[];
  level: string;
  content: string;
  status: 'draft' | 'published';
  createdAt: number;
  updatedAt: number;
}

const LEVELS = new Set(['beginner', 'intermediate', 'advanced']);
const STATUSES = new Set(['draft', 'published']);

// Giống scripts/build-content.mjs slugify để slug nhất quán với bài static.
export function slugify(input: string): string {
  return input
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export function rowToArticle(r: ArticleRow): Article {
  let tags: string[] = [];
  try {
    const parsed = JSON.parse(r.tags);
    if (Array.isArray(parsed)) tags = parsed.filter((t) => typeof t === 'string');
  } catch {}
  return {
    id: r.id,
    slug: r.slug,
    title: r.title,
    domain: r.domain,
    category: r.category,
    tags,
    level: r.level,
    content: r.content,
    status: r.status === 'published' ? 'published' : 'draft',
    createdAt: r.createdAt,
    updatedAt: r.updatedAt,
  };
}

// Bỏ content để danh sách nhẹ (reader mới fetch full theo slug).
export function toListItem(a: Article) {
  const { content, ...rest } = a;
  void content;
  return rest;
}

export interface ArticleInput {
  title: string;
  slug: string;
  domain: string;
  category: string;
  tags: string[];
  level: string;
  content: string;
  status: 'draft' | 'published';
}

export function parseInput(body: unknown): { ok: true; value: ArticleInput } | { ok: false; error: string } {
  if (typeof body !== 'object' || body === null) return { ok: false, error: 'Body không hợp lệ' };
  const b = body as Record<string, unknown>;
  const title = typeof b.title === 'string' ? b.title.trim() : '';
  if (!title) return { ok: false, error: 'Thiếu tiêu đề' };
  let slug = typeof b.slug === 'string' && b.slug.trim() ? slugify(b.slug) : slugify(title);
  if (!slug) return { ok: false, error: 'Slug không hợp lệ' };
  const domain = typeof b.domain === 'string' ? b.domain.trim() : '';
  const category = typeof b.category === 'string' ? b.category.trim() : '';
  if (!domain || !category) return { ok: false, error: 'Thiếu domain hoặc category' };
  const level = typeof b.level === 'string' && LEVELS.has(b.level) ? b.level : 'beginner';
  const status = typeof b.status === 'string' && STATUSES.has(b.status) ? (b.status as 'draft' | 'published') : 'draft';
  const content = typeof b.content === 'string' ? b.content : '';
  let tags: string[] = [];
  if (Array.isArray(b.tags)) tags = [...new Set(b.tags.filter((t): t is string => typeof t === 'string' && t.trim() !== '').map((t) => t.trim()))];
  return { ok: true, value: { title, slug, domain, category, tags, level, content, status } };
}

export async function findBySlug(env: Env, slug: string): Promise<Article | null> {
  const row = await env.DB.prepare('SELECT * FROM articles WHERE slug = ?').bind(slug).first<ArticleRow>();
  return row ? rowToArticle(row) : null;
}
