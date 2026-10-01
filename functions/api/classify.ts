import { type Ctx, isAdmin, json, badRequest, unauthorized, tooMany } from '../_lib/auth';
import { slugify } from '../_lib/articles';
import { allow } from '../_lib/ratelimit';

// POST /api/classify — admin: gợi ý phân loại bằng Gemini. Server-side, structured JSON, validate.
// KHÔNG tự lưu/publish; chỉ trả đề xuất để form điền. Key không bao giờ xuống browser.

const MAX_CONTENT = 6000; // giới hạn markdown gửi đi để kiểm soát token/cost
const LEVELS = new Set(['basic', 'intermediate', 'advanced']);

interface TaxoCat {
  id: string;
  title: string;
}
interface TaxoDomain {
  id: string;
  title: string;
  category: string;
}

function strList<T>(v: unknown, map: (x: Record<string, unknown>) => T | null, cap: number): T[] {
  if (!Array.isArray(v)) return [];
  const out: T[] = [];
  for (const item of v) {
    if (out.length >= cap) break;
    if (item && typeof item === 'object') {
      const m = map(item as Record<string, unknown>);
      if (m) out.push(m);
    }
  }
  return out;
}

const GEMINI_SCHEMA = {
  type: 'OBJECT',
  properties: {
    domain: { type: 'STRING' },
    category: { type: 'STRING' },
    level: { type: 'STRING', enum: ['basic', 'intermediate', 'advanced'] },
    tags: { type: 'ARRAY', items: { type: 'STRING' } },
    slug: { type: 'STRING' },
    confidence: { type: 'NUMBER' },
    newCategory: { type: 'BOOLEAN' },
    newTags: { type: 'ARRAY', items: { type: 'STRING' } },
  },
  required: ['domain', 'category', 'level', 'tags', 'confidence'],
};

function buildPrompt(title: string, content: string, cats: TaxoCat[], domains: TaxoDomain[], tags: string[]): string {
  const catLines = cats.map((c) => `- ${c.id} — ${c.title}`).join('\n');
  const domLines = domains.map((d) => `- ${d.id} — ${d.title} (thuộc nhóm: ${d.category})`).join('\n');
  return [
    'Bạn là bộ phân loại tài liệu học tiếng Việt. Chọn phân loại phù hợp NHẤT cho bài dưới đây dựa trên taxonomy có sẵn.',
    '',
    'NHÓM (category) có sẵn:',
    catLines || '(trống)',
    '',
    'LĨNH VỰC (domain) có sẵn:',
    domLines || '(trống)',
    '',
    `TAG đã có: ${tags.join(', ') || '(trống)'}`,
    '',
    'QUY TẮC:',
    '- "category" và "domain" PHẢI là id lấy từ danh sách trên nếu có nhóm/lĩnh vực phù hợp; "domain" phải thuộc đúng "category".',
    '- Chỉ đặt newCategory=true nếu KHÔNG có nhóm/lĩnh vực nào phù hợp; khi đó "category"/"domain" ghi tên tiếng Việt gợi ý.',
    '- "tags": ưu tiên tag đã có; tag chưa có đưa thêm vào "newTags".',
    '- "level": basic | intermediate | advanced.',
    '- "slug": gợi ý không dấu, chỉ a-z 0-9 và gạch ngang.',
    '- "confidence": 0..1 theo mức chắc chắn.',
    '- Chỉ dựa vào tiêu đề và nội dung; không bịa thông tin.',
    '',
    `TIÊU ĐỀ: ${title || '(trống)'}`,
    'NỘI DUNG:',
    content || '(trống)',
  ].join('\n');
}

export const onRequestPost = async (ctx: Ctx): Promise<Response> => {
  if (!(await isAdmin(ctx))) return unauthorized();

  const ip = ctx.request.headers.get('CF-Connecting-IP') ?? '0';
  if (!(await allow(ctx.env, `classify:${ip}`, 15, 60_000, Date.now()))) return tooMany();

  if (!ctx.env.GEMINI_API_KEY) return json({ error: 'GEMINI_API_KEY chưa cấu hình trên server.' }, { status: 503 });

  let body: Record<string, unknown>;
  try {
    body = (await ctx.request.json()) as Record<string, unknown>;
  } catch {
    return badRequest('JSON không hợp lệ');
  }

  const title = typeof body.title === 'string' ? body.title.trim().slice(0, 300) : '';
  const content = typeof body.content === 'string' ? body.content.slice(0, MAX_CONTENT) : '';
  if (!title && !content) return badRequest('Cần tiêu đề hoặc nội dung để phân loại.');

  const cats = strList<TaxoCat>(body.categories, (x) => (typeof x.id === 'string' && typeof x.title === 'string' ? { id: x.id, title: x.title } : null), 50);
  const domains = strList<TaxoDomain>(
    body.domains,
    (x) => (typeof x.id === 'string' && typeof x.title === 'string' && typeof x.category === 'string' ? { id: x.id, title: x.title, category: x.category } : null),
    200,
  );
  const tags = Array.isArray(body.tags) ? body.tags.filter((t): t is string => typeof t === 'string').slice(0, 120) : [];

  const model = ctx.env.GEMINI_MODEL || 'gemini-2.5-flash';
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${ctx.env.GEMINI_API_KEY}`;
  const payload = {
    contents: [{ parts: [{ text: buildPrompt(title, content, cats, domains, tags) }] }],
    generationConfig: { responseMimeType: 'application/json', responseSchema: GEMINI_SCHEMA, temperature: 0.2 },
  };

  let geminiText: string;
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 12_000);
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      signal: controller.signal,
    }).finally(() => clearTimeout(timer));
    if (!res.ok) return json({ error: 'Gemini trả về lỗi, thử lại sau.' }, { status: 502 });
    const data = (await res.json()) as { candidates?: { content?: { parts?: { text?: string }[] } }[] };
    geminiText = data.candidates?.[0]?.content?.parts?.[0]?.text ?? '';
  } catch {
    return json({ error: 'Gemini quá thời gian hoặc không phản hồi.' }, { status: 502 });
  }

  let parsed: Record<string, unknown>;
  try {
    parsed = JSON.parse(geminiText) as Record<string, unknown>;
  } catch {
    return json({ error: 'Không đọc được kết quả từ Gemini.' }, { status: 502 });
  }

  // ---- validate + compute authoritative (không tin tuyệt đối vào model) ----
  const catIds = new Set(cats.map((c) => c.id));
  const domById = new Map(domains.map((d) => [d.id, d]));
  const tagSet = new Set(tags);

  let category = typeof parsed.category === 'string' ? parsed.category.trim() : '';
  let domain = typeof parsed.domain === 'string' ? parsed.domain.trim() : '';
  const knownDomain = domById.get(domain);
  if (knownDomain) category = knownDomain.category; // domain đã biết -> lấy đúng category cha
  const newCategory = !(knownDomain && catIds.has(category));

  const rawLevel = typeof parsed.level === 'string' ? parsed.level : 'basic';
  const level = LEVELS.has(rawLevel) ? rawLevel : 'basic';

  const suggestedTags = Array.isArray(parsed.tags) ? [...new Set(parsed.tags.filter((t): t is string => typeof t === 'string' && t.trim() !== '').map((t) => t.trim()))].slice(0, 8) : [];
  const newTags = suggestedTags.filter((t) => !tagSet.has(t));

  const slug = typeof parsed.slug === 'string' ? slugify(parsed.slug) : '';
  let confidence = typeof parsed.confidence === 'number' ? parsed.confidence : 0.5;
  if (!Number.isFinite(confidence)) confidence = 0.5;
  confidence = Math.max(0, Math.min(1, confidence));

  return json({ domain, category, level, tags: suggestedTags, slug, confidence, newCategory, newTags });
};
