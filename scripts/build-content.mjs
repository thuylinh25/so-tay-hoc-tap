// Quét thư mục tài liệu, sinh manifest + HTML đã render + chỉ mục tìm kiếm, và chép tài nguyên sang public/.
// Chỉ ĐỌC tài liệu gốc. Mọi output nằm trong src/generated/ và public/files/ (đều bị gitignore).
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { unified } from 'unified';
import remarkParse from 'remark-parse';
import remarkGfm from 'remark-gfm';
import remarkBreaks from 'remark-breaks';
import remarkRehype from 'remark-rehype';
import rehypeHighlight from 'rehype-highlight';
import rehypeStringify from 'rehype-stringify';
import { visit } from 'unist-util-visit';
import { toString as hastToString } from 'hast-util-to-string';
import { parse as parseHtml } from 'node-html-parser';
import * as config from '../content.config.mjs';

const ROOT = process.cwd();
const SRC = path.join(ROOT, config.SOURCE_DIR);
const GEN = path.join(ROOT, 'src', 'generated');
const GEN_HTML = path.join(GEN, 'html');
const PUBLIC_FILES = path.join(ROOT, 'public', 'files');
const IMAGE_EXT = /\.(jpe?g|png|webp|gif)$/i;

// ---------- helpers ----------

export function slugify(input) {
  return input
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function makeSlugger() {
  const seen = new Map();
  return (text) => {
    const base = slugify(text) || 'muc';
    const n = seen.get(base) ?? 0;
    seen.set(base, n + 1);
    return n === 0 ? base : `${base}-${n + 1}`;
  };
}

function resetDir(dir) {
  fs.rmSync(dir, { recursive: true, force: true });
  fs.mkdirSync(dir, { recursive: true });
}

function copyFile(from, toRel) {
  const to = path.join(PUBLIC_FILES, toRel);
  fs.mkdirSync(path.dirname(to), { recursive: true });
  fs.copyFileSync(from, to);
  return '/files/' + toRel.split(path.sep).join('/');
}

function isIgnored(name) {
  return config.ignore.some((re) => re.test(name));
}

// Đọc kích thước JPEG/PNG từ header để trang gallery không bị nhảy layout.
function imageSize(file) {
  const buf = fs.readFileSync(file);
  if (buf[0] === 0x89 && buf.toString('ascii', 1, 4) === 'PNG') {
    return { width: buf.readUInt32BE(16), height: buf.readUInt32BE(20) };
  }
  if (buf[0] === 0xff && buf[1] === 0xd8) {
    let i = 2;
    while (i < buf.length) {
      if (buf[i] !== 0xff) { i++; continue; }
      const marker = buf[i + 1];
      const len = buf.readUInt16BE(i + 2);
      if (marker >= 0xc0 && marker <= 0xcf && ![0xc4, 0xc8, 0xcc].includes(marker)) {
        return { height: buf.readUInt16BE(i + 5), width: buf.readUInt16BE(i + 7) };
      }
      i += 2 + len;
    }
  }
  return { width: 1600, height: 2000 };
}

const clean = (s) => s.replace(/\s+/g, ' ').trim();
const wordCount = (s) => (s.match(/\S+/g) ?? []).length;

// ---------- markdown ----------

// Tài liệu dùng nhiều H1 ("# Bài 1 — …"): bỏ H1 đầu (tiêu đề), hạ mọi heading còn lại một bậc,
// gán id không dấu, bọc bảng để cuộn ngang, và mở link ngoài ở tab mới.
function rehypeDocStructure({ headings }) {
  return (tree) => {
    const slugger = makeSlugger();
    const multiH1 = tree.children.filter((n) => n.type === 'element' && n.tagName === 'h1').length > 1;
    let firstH1Removed = false;
    tree.children = tree.children.filter((n) => {
      if (!firstH1Removed && n.type === 'element' && n.tagName === 'h1') {
        firstH1Removed = true;
        return false;
      }
      return true;
    });
    visit(tree, 'element', (node, index, parent) => {
      const m = /^h([1-6])$/.exec(node.tagName);
      if (m) {
        let depth = Number(m[1]);
        if (multiH1) depth = Math.min(depth + 1, 6);
        node.tagName = `h${depth}`;
        const text = clean(hastToString(node));
        const id = slugger(text);
        node.properties = { ...node.properties, id };
        headings.push({ id, text, depth });
      }
      if (node.tagName === 'table' && parent && index != null && !(parent.properties?.className ?? []).includes('table-wrap')) {
        parent.children[index] = { type: 'element', tagName: 'div', properties: { className: ['table-wrap'] }, children: [node] };
      }
      if (node.tagName === 'a' && /^https?:/.test(node.properties?.href ?? '')) {
        node.properties.target = '_blank';
        node.properties.rel = 'noopener noreferrer';
      }
    });
  };
}

function renderMarkdown(md) {
  const headings = [];
  const file = unified()
    .use(remarkParse)
    .use(remarkGfm)
    .use(remarkBreaks) // tác giả xuống dòng đơn có chủ đích (vd. khối Đối tượng/Thời lượng)
    .use(remarkRehype)
    .use(rehypeDocStructure, { headings })
    .use(rehypeHighlight, { detect: false })
    .use(rehypeStringify)
    .processSync(md);
  return { html: String(file), headings };
}

// Tách markdown thành các đoạn theo heading để làm chỉ mục tìm kiếm (id khớp với renderMarkdown).
function markdownSections(md, headings) {
  const lines = md.split(/\r?\n/);
  const sections = [];
  let inFence = false;
  let hIndex = 0;
  let firstH1Skipped = false;
  let current = { anchor: null, heading: '', lines: [] };
  for (const line of lines) {
    if (/^\s*```/.test(line)) inFence = !inFence;
    const m = !inFence && /^(#{1,6})\s+(.*)$/.exec(line);
    if (m) {
      if (m[1].length === 1 && !firstH1Skipped) { firstH1Skipped = true; continue; }
      sections.push(current);
      const h = headings[hIndex++];
      current = { anchor: h?.id ?? null, heading: h?.text ?? clean(m[2]), lines: [] };
      continue;
    }
    current.lines.push(line);
  }
  sections.push(current);
  return sections
    .map((s) => ({ anchor: s.anchor, heading: s.heading, text: clean(s.lines.join(' ').replace(/[`*_>|#-]+/g, ' ')) }))
    .filter((s) => s.heading || s.text);
}

// ---------- html (Playwright) ----------

function htmlDoc(file) {
  const root = parseHtml(fs.readFileSync(file, 'utf8'));
  root.querySelectorAll('script,style,noscript').forEach((n) => n.remove());
  const headings = [];
  const sections = [];
  const slugger = makeSlugger();
  let current = { anchor: null, heading: '', text: [] };
  // Duyệt theo thứ tự tài liệu; h2/h3 mở đoạn mới. index = vị trí trong querySelectorAll('h2,h3') của iframe.
  let index = 0;
  const walk = (node) => {
    for (const child of node.childNodes) {
      if (child.nodeType === 1 && /^h[23]$/i.test(child.tagName)) {
        sections.push(current);
        const text = clean(child.text);
        const id = slugger(text);
        headings.push({ id, text, depth: child.tagName.toLowerCase() === 'h2' ? 2 : 3, index: index++ });
        current = { anchor: id, heading: text, text: [] };
      } else if (child.nodeType === 3) {
        current.text.push(child.text);
      } else if (child.nodeType === 1) {
        walk(child);
      }
    }
  };
  walk(root.querySelector('body') ?? root);
  sections.push(current);
  return {
    headings,
    sections: sections.map((s) => ({ anchor: s.anchor, heading: s.heading, text: clean(s.text.join(' ')) })).filter((s) => s.text),
  };
}

// ---------- pdf ----------

function pdfText(file) {
  const r = spawnSync('pdftotext', ['-enc', 'UTF-8', file, '-'], { encoding: 'utf8' });
  if (r.status !== 0 || !r.stdout) return null;
  return r.stdout;
}

function pdfSections(text) {
  // Tách theo câu hỏi "Q1. …" nếu có; nếu không, cả file là một đoạn.
  const parts = text.split(/\n(?=\s*Q\d+\.\s)/);
  const slugger = makeSlugger();
  const headings = [];
  const sections = parts.map((p, i) => {
    const m = /^\s*(Q\d+\.\s[^\n]+)/.exec(p);
    if (!m) return { anchor: null, heading: i === 0 ? '' : '', text: clean(p) };
    const heading = clean(m[1]);
    const id = slugger(heading.slice(0, 60));
    headings.push({ id, text: heading, depth: 3 });
    return { anchor: null, heading, text: clean(p.slice(m[0].length)) };
  });
  return { headings, sections };
}

// ---------- câu hỏi (flashcards / quiz / phỏng vấn) ----------

// qa/<slug>.md chép tay nguyên văn từ tài liệu <slug>: "# Trang N — Chủ đề" mở một nhóm,
// mỗi "## …" là một câu hỏi, phần Markdown bên dưới là đáp án.
function parseQa(md) {
  const items = [];
  let group = null;
  let page = null;
  let cur = null;
  let inFence = false;
  for (const line of md.split(/\r?\n/)) {
    if (/^\s*```/.test(line)) inFence = !inFence;
    const m = !inFence && /^(#{1,2})\s+(.*)$/.exec(line);
    if (m && m[1] === '#') {
      const g = /^Trang\s+(\S+)\s+—\s+(.*)$/.exec(m[2].trim());
      page = g ? g[1] : null;
      group = g ? g[2] : m[2].trim();
      cur = null;
    } else if (m) {
      cur = { q: m[2].trim(), group, page, lines: [] };
      items.push(cur);
    } else {
      cur?.lines.push(line);
    }
  }
  return items.map(({ lines, ...it }) => ({ ...it, md: lines.join('\n').trim() }));
}

const inlineHtml = (md) => renderMarkdown(md).html.trim().replace(/^<p>([\s\S]*)<\/p>$/, '$1');
// Bỏ ký hiệu Markdown nhưng giữ nguyên nội dung trong `code` (vd. `/* */`).
const stripMd = (s) =>
  clean(
    s
      .split(/(`[^`]*`)/)
      .map((part, i) => (i % 2 ? part.slice(1, -1) : part.replace(/\*/g, '')))
      .join(''),
  );

// Đáp án rút gọn (không code) làm phương án trắc nghiệm; rỗng nếu đáp án chỉ có code.
function shortAnswer(md) {
  const text = md
    .replace(/```[\s\S]*?```/g, '\n')
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l && !/^\|?\s*:?-{3,}/.test(l))
    .map((l) => (l.startsWith('|') ? l.replace(/^\||\|$/g, '').split('|').map((c) => c.trim()).join(': ') : l.replace(/^[-*]\s+|^\d+\.\s+/, '')))
    .reduce((acc, l) => (!acc ? l : /[:;.]$/.test(acc) ? `${acc} ${l}` : `${acc}; ${l}`), '');
  const s = stripMd(text);
  if (/^Input\b/.test(s)) return ''; // bài toán code: đáp án là code, không làm phương án được
  if (s.length <= 220) return s;
  const cut = s.slice(0, 220);
  return cut.slice(0, cut.lastIndexOf(' ')) + '…';
}

const escapeRe = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

// Ghi rõ ngữ cảnh cho câu hỏi chưa nhắc tới nó (Markdown thô, trước khi render):
// "Làm thế nào…?" → "Trong Python, làm thế nào…?"; "Two Sum: …" → "Two Sum (Python): …";
// câu tiếng Anh hoặc mở đầu bằng từ khoá/tên riêng → thêm "(Python)" ở cuối.
function withContext(q, ctx) {
  if (!ctx || new RegExp(`\\b${escapeRe(ctx)}\\b`, 'i').test(q)) return q;
  const title = /^([^:?`]{2,40}):\s/.exec(q);
  if (title) return `${title[1]} (${ctx}):${q.slice(title[0].length - 1)}`;
  const english = /^(How|What|Why|When|Write|Which|Explain)\b/.test(q);
  // Chỉ viết thường chữ đầu nếu là một từ thường (Làm, Có, Ép…), không phải SELECT, COUNT(), Primary Key…
  const plainFirst = /^\p{Lu}\p{Ll}*\s+\p{Ll}/u.test(q);
  if (english || !plainFirst) return `${q} (${ctx})`;
  return `Trong ${ctx}, ${q[0].toLocaleLowerCase('vi')}${q.slice(1)}`;
}

function buildQa(docsBySlug, searchDocs, warnings) {
  const dir = path.join(ROOT, 'qa');
  const items = [];
  if (!fs.existsSync(dir)) return items;
  for (const f of fs.readdirSync(dir).filter((f) => f.endsWith('.md')).sort()) {
    const slug = f.replace(/\.md$/, '');
    const doc = docsBySlug.get(slug);
    if (!doc) {
      warnings.push(`qa/${f}: không có tài liệu slug "${slug}"`);
      continue;
    }
    const slugger = makeSlugger();
    const ctx = config.docs.find((d) => d.slug === slug)?.qaContext;
    for (const it of parseQa(fs.readFileSync(path.join(dir, f), 'utf8'))) {
      if (!it.md) warnings.push(`qa/${f}: câu "${it.q}" chưa có đáp án`);
      // id tính từ câu gốc để tiến độ ôn tập không đổi khi thêm/đổi ngữ cảnh.
      const idText = it.q;
      it.q = withContext(it.q, ctx);
      const anchor = doc.kind === 'gallery' && it.page ? `trang-${slugify(it.page)}` : null;
      const item = {
        id: `${slug}:${slugger(idText).slice(0, 80)}`,
        doc: slug,
        topic: doc.topic,
        domain: doc.domain,
        group: it.group,
        page: it.page,
        anchor,
        q: stripMd(it.q),
        qHtml: inlineHtml(it.q),
        aHtml: renderMarkdown(it.md).html,
        short: shortAnswer(it.md),
      };
      items.push(item);
      // Sổ tay ảnh không có text: câu hỏi chép lại giúp tìm kiếm được nội dung bên trong.
      if (doc.kind === 'gallery') {
        const topicTitle = config.topics.find((t) => t.id === doc.topic)?.title ?? '';
        const domainTitle = config.domains.find((x) => x.id === doc.domain)?.title ?? '';
        searchDocs.push({ id: `${slug}::qa::${items.length}`, slug, anchor, title: doc.title, category: `${domainTitle} › ${topicTitle}`, tags: (doc.tags ?? []).join(' '), heading: item.q, text: stripMd(it.md.replace(/```/g, ' ')).slice(0, 2000) });
      }
    }
  }
  return items;
}

// ---------- main ----------

function main() {
  if (!fs.existsSync(SRC)) {
    console.error(`Không tìm thấy thư mục tài liệu: ${SRC}`);
    process.exit(1);
  }
  resetDir(GEN_HTML);
  resetDir(PUBLIC_FILES);

  const topicById = new Map(config.topics.map((t) => [t.id, t]));
  const domainById = new Map(config.domains.map((d) => [d.id, d]));
  const categoryById = new Map(config.categories.map((c) => [c.id, c]));

  // Category layout 'flat' (vd Sức khỏe): bài nằm trực tiếp dưới category, không có topic.
  // Sinh domain + topic ảo id = category id để getDomain/getTopic/qa.ts vẫn tra cứu được.
  for (const c of config.categories) {
    if (c.layout !== 'flat') continue;
    if (!domainById.has(c.id)) domainById.set(c.id, { id: c.id, category: c.id, title: c.title, description: c.description ?? '' });
    if (!topicById.has(c.id)) topicById.set(c.id, { id: c.id, domain: c.id, title: c.title });
  }

  const configured = new Map(config.docs.map((d) => [d.source, d]));
  const attachmentSources = new Set(config.docs.flatMap((d) => (d.attachments ?? []).map((a) => a.source)));
  const out = [];
  const searchDocs = [];
  const warnings = [];

  // Tài liệu mới chưa khai báo trong content.config.mjs vẫn được đưa vào mục "Chưa phân loại".
  const entries = fs.readdirSync(SRC, { withFileTypes: true }).filter((e) => !isIgnored(e.name));
  for (const e of entries) {
    if (configured.has(e.name) || attachmentSources.has(e.name)) continue;
    const isDir = e.isDirectory();
    if (isDir && !fs.readdirSync(path.join(SRC, e.name)).some((f) => IMAGE_EXT.test(f))) {
      warnings.push(`Bỏ qua folder không có ảnh: ${e.name}`);
      continue;
    }
    if (!isDir && !/\.(md|pdf|html?)$/i.test(e.name)) {
      warnings.push(`Bỏ qua file không hỗ trợ: ${e.name}`);
      continue;
    }
    const title = e.name.replace(/\.[^.]+$/, '');
    configured.set(e.name, { source: e.name, slug: slugify(title), title, topic: 'uncategorized', level: 'beginner', tags: isDir ? ['handbook-images'] : [] });
    warnings.push(`Tài liệu chưa phân loại: ${e.name} (thêm vào content.config.mjs)`);
  }

  let order = 0;
  for (const d of configured.values()) {
    const abs = path.join(SRC, d.source);
    if (!fs.existsSync(abs)) {
      warnings.push(`Không tìm thấy: ${d.source}`);
      continue;
    }
    // Bài 'flat' khai `category` trực tiếp, không có topic → dùng topic ảo id = category id.
    const topicId = d.topic ?? d.category;
    const topic = topicById.get(topicId);
    if (!topic) throw new Error(`Topic không tồn tại: ${d.topic ?? d.category} (${d.source})`);
    const domainOf = domainById.get(topic.domain);
    if (!domainOf) throw new Error(`Domain không tồn tại: ${topic.domain} (${d.source})`);
    if (!categoryById.has(domainOf.category)) throw new Error(`Category không tồn tại: ${domainOf.category} (${d.source})`);
    const meta = {
      slug: d.slug,
      title: d.title,
      subtitle: d.subtitle ?? null,
      category: domainOf.category,
      domain: topic.domain,
      topic: topic.id,
      level: d.level,
      tags: d.tags ?? [],
      order: order++,
      source: d.source,
      related: d.related ?? [],
      note: d.note ?? null,
      headings: [],
      stats: {},
    };
    let sections = [];

    if (fs.statSync(abs).isDirectory()) {
      meta.kind = 'gallery';
      const files = fs
        .readdirSync(abs)
        .filter((f) => IMAGE_EXT.test(f) && !isIgnored(f))
        .sort((a, b) => parseFloat(a) - parseFloat(b) || a.localeCompare(b));
      meta.pages = files.map((f, i) => {
        const stem = f.replace(IMAGE_EXT, '');
        const id = `trang-${slugify(stem)}`;
        const { width, height } = imageSize(path.join(abs, f));
        return { id, label: `Trang ${stem}`, src: copyFile(path.join(abs, f), path.join(d.slug, `${slugify(stem)}${path.extname(f).toLowerCase()}`)), width, height, n: i + 1 };
      });
      meta.headings = meta.pages.map((p) => ({ id: p.id, text: p.label, depth: 2 }));
      meta.stats = { pages: files.length };
      sections = meta.pages.map((p) => ({ anchor: p.id, heading: p.label, text: '' }));
    } else if (/\.md$/i.test(d.source)) {
      meta.kind = 'markdown';
      const md = fs.readFileSync(abs, 'utf8');
      const { html, headings } = renderMarkdown(md);
      fs.writeFileSync(path.join(GEN_HTML, `${d.slug}.html`), html);
      meta.headings = headings;
      const words = wordCount(md);
      meta.stats = { words, minutes: Math.max(1, Math.round(words / 200)), codeBlocks: (md.match(/^\s*```/gm) ?? []).length / 2 };
      sections = markdownSections(md, headings);
    } else if (/\.html?$/i.test(d.source)) {
      meta.kind = 'html';
      meta.file = copyFile(abs, path.join(d.slug, 'index.html'));
      const r = htmlDoc(abs);
      meta.headings = r.headings;
      const words = r.sections.reduce((n, s) => n + wordCount(s.text), 0);
      meta.stats = { words, minutes: Math.max(1, Math.round(words / 200)) };
      sections = r.sections;
    } else if (/\.pdf$/i.test(d.source)) {
      meta.kind = 'pdf';
      meta.file = copyFile(abs, path.join(d.slug, `${d.slug}.pdf`));
      // pdftotext (xpdf) trên Windows không mở được đường dẫn có dấu → đọc bản đã chép (tên ASCII).
      const text = pdfText(path.relative(ROOT, path.join(ROOT, 'public', meta.file)));
      if (text) {
        const r = pdfSections(text);
        meta.questions = r.headings.map((h) => h.text);
        sections = r.sections;
        meta.stats = { questions: r.headings.length };
      } else {
        warnings.push(`Không trích được text PDF (thiếu pdftotext?): ${d.source}`);
      }
    }

    meta.attachments = (d.attachments ?? [])
      .filter((a) => fs.existsSync(path.join(SRC, a.source)))
      .map((a) => ({ label: a.label, url: copyFile(path.join(SRC, a.source), path.join(d.slug, slugify(a.source.replace(/\.[^.]+$/, '')) + path.extname(a.source).toLowerCase())) }));

    const topicTitle = topic.title;
    const domainTitle = domainOf.title;
    // Bài 'flat' (domain ảo = category): chỉ hiện tên category; bài 'tree': "Lĩnh vực › Chủ đề".
    const crumb = domainOf.id === meta.category ? (categoryById.get(meta.category)?.title ?? '') : `${domainTitle} › ${topicTitle}`;
    const tagStr = (d.tags ?? []).join(' ');
    searchDocs.push({ id: `${d.slug}`, slug: d.slug, anchor: null, title: d.title, category: crumb, tags: tagStr, heading: '', text: d.subtitle ?? '' });
    sections.forEach((s, i) => {
      if (!s.heading && !s.text) return;
      searchDocs.push({ id: `${d.slug}::${i}`, slug: d.slug, anchor: s.anchor, title: d.title, category: crumb, tags: tagStr, heading: s.heading, text: s.text.slice(0, 6000) });
    });
    out.push(meta);
  }

  const slugs = new Set(out.map((d) => d.slug));
  for (const d of out) d.related = d.related.filter((s) => slugs.has(s));
  const roadmaps = config.roadmaps.map((r) => ({ ...r, steps: r.steps.filter((s) => slugs.has(s)) }));
  const usedTopics = new Set(out.map((d) => d.topic));
  const usedDomains = new Set(out.map((d) => d.domain));
  const usedCategories = new Set(out.map((d) => d.category));
  const qa = buildQa(new Map(out.map((d) => [d.slug, d])), searchDocs, warnings);

  // domainById/topicById gồm cả domain/topic ảo của category 'flat' → manifest phủ cả Sức khỏe.
  const manifest = {
    generatedAt: new Date().toISOString(),
    categories: config.categories.filter((c) => usedCategories.has(c.id)),
    domains: [...domainById.values()].filter((dm) => usedDomains.has(dm.id)),
    topics: [...topicById.values()].filter((t) => usedTopics.has(t.id)),
    docs: out,
    roadmaps,
  };
  fs.mkdirSync(GEN, { recursive: true });
  fs.writeFileSync(path.join(GEN, 'manifest.json'), JSON.stringify(manifest, null, 1));
  fs.writeFileSync(path.join(ROOT, 'public', 'search-index.json'), JSON.stringify(searchDocs));
  // Đáp án đã render khá nặng → file tĩnh, trang ôn tập tải khi cần thay vì nhúng vào bundle.
  fs.writeFileSync(path.join(ROOT, 'public', 'qa.json'), JSON.stringify(qa));

  const byKind = out.reduce((m, d) => ((m[d.kind] = (m[d.kind] ?? 0) + 1), m), {});
  console.log(`✓ ${out.length} tài liệu`, byKind, `· ${qa.length} câu hỏi · ${searchDocs.length} mục tìm kiếm`);
  warnings.forEach((w) => console.warn('  ! ' + w));
}

main();
