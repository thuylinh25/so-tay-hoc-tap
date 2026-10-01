import { type Ctx, isAdmin, json, badRequest, unauthorized } from '../../_lib/auth';
import { type ArticleRow, parseInput, rowToArticle, toListItem } from '../../_lib/articles';

// GET /api/articles — public: chỉ published; admin: tất cả (gồm draft). Không trả content (danh sách nhẹ).
export const onRequestGet = async (ctx: Ctx): Promise<Response> => {
  const admin = await isAdmin(ctx);
  const sql = admin
    ? 'SELECT * FROM articles ORDER BY updatedAt DESC'
    : "SELECT * FROM articles WHERE status = 'published' ORDER BY updatedAt DESC";
  const rows = (await ctx.env.DB.prepare(sql).all<ArticleRow>()).results ?? [];
  return json({ articles: rows.map((r) => toListItem(rowToArticle(r))) });
};

// POST /api/articles — admin: tạo bài. Slug trùng -> 409.
export const onRequestPost = async (ctx: Ctx): Promise<Response> => {
  if (!(await isAdmin(ctx))) return unauthorized();
  let body: unknown;
  try {
    body = await ctx.request.json();
  } catch {
    return badRequest('JSON không hợp lệ');
  }
  const parsed = parseInput(body);
  if (!parsed.ok) return badRequest(parsed.error);
  const v = parsed.value;
  const exists = await ctx.env.DB.prepare('SELECT 1 FROM articles WHERE slug = ?').bind(v.slug).first();
  if (exists) return json({ error: 'Slug đã tồn tại' }, { status: 409 });
  const now = Date.now();
  const id = crypto.randomUUID();
  await ctx.env.DB.prepare(
    'INSERT INTO articles (id,slug,title,domain,category,tags,level,content,status,createdAt,updatedAt) VALUES (?,?,?,?,?,?,?,?,?,?,?)',
  )
    .bind(id, v.slug, v.title, v.domain, v.category, JSON.stringify(v.tags), v.level, v.content, v.status, now, now)
    .run();
  return json({ article: { id, ...v, createdAt: now, updatedAt: now } }, { status: 201 });
};
