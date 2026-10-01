import { type Ctx, isAdmin, json, badRequest, unauthorized } from '../../_lib/auth';
import { findBySlug, parseInput } from '../../_lib/articles';

// GET /api/articles/:slug — public: chỉ published; admin: cả draft. Trả full content.
export const onRequestGet = async (ctx: Ctx<'slug'>): Promise<Response> => {
  const admin = await isAdmin(ctx);
  const a = await findBySlug(ctx.env, ctx.params.slug);
  if (!a || (a.status !== 'published' && !admin)) return json({ error: 'not found' }, { status: 404 });
  return json({ article: a });
};

// PUT /api/articles/:slug — admin: cập nhật. Đổi slug phải không trùng.
export const onRequestPut = async (ctx: Ctx<'slug'>): Promise<Response> => {
  if (!(await isAdmin(ctx))) return unauthorized();
  const current = await findBySlug(ctx.env, ctx.params.slug);
  if (!current) return json({ error: 'not found' }, { status: 404 });
  let body: unknown;
  try {
    body = await ctx.request.json();
  } catch {
    return badRequest('JSON không hợp lệ');
  }
  const parsed = parseInput(body);
  if (!parsed.ok) return badRequest(parsed.error);
  const v = parsed.value;
  if (v.slug !== current.slug) {
    const clash = await ctx.env.DB.prepare('SELECT 1 FROM articles WHERE slug = ?').bind(v.slug).first();
    if (clash) return json({ error: 'Slug đã tồn tại' }, { status: 409 });
  }
  const now = Date.now();
  await ctx.env.DB.prepare(
    'UPDATE articles SET slug=?,title=?,domain=?,category=?,tags=?,level=?,content=?,status=?,updatedAt=? WHERE id=?',
  )
    .bind(v.slug, v.title, v.domain, v.category, JSON.stringify(v.tags), v.level, v.content, v.status, now, current.id)
    .run();
  return json({ article: { id: current.id, ...v, createdAt: current.createdAt, updatedAt: now } });
};

// DELETE /api/articles/:slug — admin.
export const onRequestDelete = async (ctx: Ctx<'slug'>): Promise<Response> => {
  if (!(await isAdmin(ctx))) return unauthorized();
  const res = await ctx.env.DB.prepare('DELETE FROM articles WHERE slug = ?').bind(ctx.params.slug).run();
  const changes = (res.meta as { changes?: number })?.changes ?? 0;
  if (!changes) return json({ error: 'not found' }, { status: 404 });
  return json({ ok: true });
};
