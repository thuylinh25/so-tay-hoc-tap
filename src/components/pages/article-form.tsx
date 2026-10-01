'use client';

// Form tạo bài viết mới (admin). Taxonomy lấy động từ manifest hiện tại; slug tự sinh + sửa được + chống trùng.
// Lưu nháp / Xuất bản đều POST /api/articles (server kiểm quyền admin + trùng slug). Không sửa source, không deploy lại.
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import Markdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Eye, Pencil, Plus, Sparkles, X } from 'lucide-react';
import { categories, docs, domains, levelLabel, type Level } from '@/lib/content';
import { refreshDynamic, useDynamicState } from '@/lib/dynamic';
import { slugify } from '@/lib/slug';
import { PageHeader } from '../ui';

const LEVELS: Level[] = ['beginner', 'intermediate', 'advanced'];
const LEVEL_MAP: Record<string, Level> = { basic: 'beginner', intermediate: 'intermediate', advanced: 'advanced' };

interface Suggestion {
  domain: string;
  category: string;
  level: string;
  tags: string[];
  slug: string;
  confidence: number;
  newCategory: boolean;
  newTags: string[];
}

export function ArticleForm() {
  const router = useRouter();
  const { admin, loaded, articles } = useDynamicState();

  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [slugEdited, setSlugEdited] = useState(false);
  const [category, setCategory] = useState(categories[0]?.id ?? '');
  const domainsInCat = useMemo(() => domains.filter((d) => d.category === category), [category]);
  const [domain, setDomain] = useState(domainsInCat[0]?.id ?? '');
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [level, setLevel] = useState<Level>('beginner');
  const [content, setContent] = useState('');
  const [preview, setPreview] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  // Giữ domain hợp lệ khi đổi nhóm.
  useEffect(() => {
    if (!domainsInCat.some((d) => d.id === domain)) setDomain(domainsInCat[0]?.id ?? '');
  }, [domainsInCat, domain]);

  // Slug tự sinh từ tiêu đề cho tới khi người dùng tự sửa.
  useEffect(() => {
    if (!slugEdited) setSlug(slugify(title));
  }, [title, slugEdited]);

  const existingTags = useMemo(() => {
    const set = new Set<string>();
    for (const d of docs) d.tags.forEach((t) => set.add(t));
    for (const a of articles) (a.tags ?? []).forEach((t) => set.add(t));
    return [...set].sort((a, b) => a.localeCompare(b, 'vi'));
  }, [articles]);

  const takenSlugs = useMemo(() => {
    const set = new Set(docs.map((d) => d.slug));
    for (const a of articles) set.add(a.slug);
    return set;
  }, [articles]);

  const slugClash = slug !== '' && takenSlugs.has(slug);

  // ---- Tự động phân loại (Gemini) ----
  const domById = useMemo(() => new Map(domains.map((d) => [d.id, d])), []);
  const [classifying, setClassifying] = useState(false);
  const [classifyError, setClassifyError] = useState('');
  const [suggestion, setSuggestion] = useState<Suggestion | null>(null);

  function applySuggestion(r: Suggestion) {
    if (!r.newCategory && r.domain && domById.has(r.domain)) {
      const d = domById.get(r.domain)!;
      setCategory(d.category);
      setDomain(d.id);
    }
    setLevel(LEVEL_MAP[r.level] ?? 'beginner');
    if (r.tags.length) setTags((prev) => [...new Set([...prev, ...r.tags])]);
    if (!slug && r.slug) {
      setSlug(r.slug);
      setSlugEdited(true);
    }
  }

  async function classify() {
    setClassifyError('');
    if (!title.trim() && !content.trim()) {
      setClassifyError('Nhập tiêu đề hoặc nội dung trước.');
      return;
    }
    setClassifying(true);
    try {
      const res = await fetch('/api/classify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify({
          title,
          content,
          categories: categories.map((c) => ({ id: c.id, title: c.title })),
          domains: domains.map((d) => ({ id: d.id, title: d.title, category: d.category })),
          tags: existingTags,
        }),
      });
      if (res.status === 401) {
        router.push('/admin');
        return;
      }
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        setClassifyError(d.error ?? 'Phân loại thất bại.');
        return;
      }
      const r = (await res.json()) as Suggestion;
      setSuggestion(r);
      if (r.confidence >= 0.6) applySuggestion(r); // tin cậy cao -> tự điền; thấp -> chờ người dùng bấm Áp dụng
    } catch {
      setClassifyError('Không gọi được dịch vụ phân loại.');
    } finally {
      setClassifying(false);
    }
  }

  function toggleTag(t: string) {
    setTags((prev) => (prev.includes(t) ? prev.filter((x) => x !== t) : [...prev, t]));
  }
  function addTag() {
    const t = tagInput.trim();
    if (t && !tags.includes(t)) setTags((prev) => [...prev, t]);
    setTagInput('');
  }

  async function save(status: 'draft' | 'published') {
    setError('');
    if (!title.trim()) return setError('Thiếu tiêu đề.');
    if (!slug) return setError('Thiếu slug.');
    if (slugClash) return setError('Slug đã tồn tại, hãy đổi slug khác.');
    if (!category || !domain) return setError('Hãy chọn nhóm và lĩnh vực.');
    setBusy(true);
    try {
      const res = await fetch('/api/articles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify({ title: title.trim(), slug, domain, category, tags, level, content, status }),
      });
      if (res.status === 401) {
        router.push('/admin');
        return;
      }
      if (res.status === 409) {
        setError('Slug đã tồn tại, hãy đổi slug khác.');
        return;
      }
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        setError(d.error ?? 'Không lưu được bài viết.');
        return;
      }
      await refreshDynamic();
      router.push(`/learn/${slug}`);
    } finally {
      setBusy(false);
    }
  }

  if (loaded && !admin)
    return (
      <div className="mx-auto flex max-w-md flex-col items-start gap-3 px-4 py-16 sm:px-8">
        <h1 className="font-display text-2xl font-semibold">Cần quyền admin</h1>
        <p className="text-sm text-muted">Đăng nhập admin để tạo bài viết.</p>
        <Link href="/admin" className="rounded-md bg-accent px-3 py-2 text-sm font-medium text-accent-ink hover:opacity-90">
          Đăng nhập
        </Link>
      </div>
    );

  const field = 'h-10 w-full rounded-md border border-line bg-surface px-3 text-sm outline-none focus:border-accent';

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6 px-4 py-8 sm:px-8">
      <PageHeader eyebrow="Thư viện" title="Bài viết mới" />

      <div className="flex flex-col gap-5">
        <label className="flex flex-col gap-1.5">
          <span className="text-sm font-medium">Tiêu đề</span>
          <input value={title} onChange={(e) => setTitle(e.target.value)} className={field} placeholder="Tên bài viết" />
        </label>

        <label className="flex flex-col gap-1.5">
          <span className="text-sm font-medium">Slug</span>
          <input
            value={slug}
            onChange={(e) => {
              setSlugEdited(true);
              setSlug(slugify(e.target.value));
            }}
            className={`${field} font-mono ${slugClash ? 'border-danger' : ''}`}
            placeholder="slug-bai-viet"
          />
          <span className={`text-xs ${slugClash ? 'text-danger' : 'text-muted'}`}>
            {slugClash ? 'Slug đã tồn tại.' : `URL: /learn/${slug || '…'}`}
          </span>
        </label>

        <div className="flex items-center justify-between gap-2">
          <span className="text-sm font-medium">Phân loại</span>
          <button
            type="button"
            onClick={classify}
            disabled={classifying}
            className="inline-flex items-center gap-1.5 rounded-md border border-line bg-accent-soft px-3 py-1.5 text-sm font-medium text-accent hover:opacity-90 disabled:opacity-60"
          >
            <Sparkles className="size-4" aria-hidden /> {classifying ? 'Đang phân loại…' : 'Tự động phân loại'}
          </button>
        </div>
        {classifyError && <p className="-mt-3 text-sm text-danger">{classifyError}</p>}

        <div className="grid gap-5 sm:grid-cols-2">
          <label className="flex flex-col gap-1.5">
            <span className="text-sm font-medium">Nhóm</span>
            <select value={category} onChange={(e) => setCategory(e.target.value)} className={field}>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.title}
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1.5">
            <span className="text-sm font-medium">Lĩnh vực (Subcategory)</span>
            <select value={domain} onChange={(e) => setDomain(e.target.value)} className={field}>
              {domainsInCat.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.title}
                </option>
              ))}
            </select>
          </label>
        </div>

        {suggestion && (
          <div className="-mt-2 flex flex-col gap-1.5 rounded-md border border-line bg-sunk p-3 text-sm">
            <div className="flex items-center justify-between gap-2">
              <span className="font-medium">✨ Gemini đề xuất · tin cậy {Math.round(suggestion.confidence * 100)}%</span>
              {suggestion.confidence < 0.6 && (
                <button type="button" onClick={() => applySuggestion(suggestion)} className="rounded-md border border-accent bg-accent-soft px-2.5 py-1 text-xs font-medium text-accent hover:opacity-90">
                  Áp dụng
                </button>
              )}
            </div>
            <ul className="flex flex-col gap-0.5 text-muted">
              <li>
                Nhóm/Lĩnh vực:{' '}
                {suggestion.newCategory ? (
                  <span className="text-warn">
                    {suggestion.category} / {suggestion.domain} (mới — chưa có, chọn thủ công)
                  </span>
                ) : (
                  <span className="text-ink-2">
                    {categories.find((c) => c.id === suggestion.category)?.title ?? suggestion.category} /{' '}
                    {domById.get(suggestion.domain)?.title ?? suggestion.domain}
                  </span>
                )}
              </li>
              <li>Level: {levelLabel[LEVEL_MAP[suggestion.level] ?? 'beginner']}</li>
              {suggestion.tags.length > 0 && (
                <li>
                  Tags: {suggestion.tags.join(', ')}
                  {suggestion.newTags.length > 0 && <span className="text-warn"> (mới: {suggestion.newTags.join(', ')})</span>}
                </li>
              )}
              {suggestion.slug && <li>Slug gợi ý: {suggestion.slug}</li>}
            </ul>
            <p className={`text-xs ${suggestion.confidence >= 0.6 ? 'text-success' : 'text-muted'}`}>
              {suggestion.confidence >= 0.6 ? 'Đã tự điền các trường phù hợp — bạn vẫn sửa được.' : 'Độ tin cậy thấp — kiểm tra rồi bấm Áp dụng.'}
            </p>
          </div>
        )}

        <div className="flex flex-col gap-1.5">
          <span className="text-sm font-medium">Level</span>
          <div className="flex flex-wrap gap-1.5">
            {LEVELS.map((l) => (
              <button
                key={l}
                type="button"
                onClick={() => setLevel(l)}
                className={`rounded-full border px-3 py-1.5 text-sm ${level === l ? 'border-accent bg-accent-soft text-accent' : 'border-line bg-surface text-ink-2 hover:border-ink-2'}`}
              >
                {levelLabel[l]}
              </button>
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          <span className="text-sm font-medium">Tags</span>
          {tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {tags.map((t) => (
                <span key={t} className="inline-flex items-center gap-1 rounded-full bg-accent-soft px-2.5 py-1 text-sm text-accent">
                  {t}
                  <button type="button" onClick={() => toggleTag(t)} aria-label={`Bỏ ${t}`}>
                    <X className="size-3.5" />
                  </button>
                </span>
              ))}
            </div>
          )}
          <div className="flex gap-2">
            <input
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  addTag();
                }
              }}
              className={field}
              placeholder="Thêm tag mới rồi Enter"
            />
            <button type="button" onClick={addTag} className="inline-flex shrink-0 items-center gap-1 rounded-md border border-line bg-surface px-3 text-sm hover:border-accent">
              <Plus className="size-4" /> Thêm
            </button>
          </div>
          {existingTags.length > 0 && (
            <div className="flex flex-wrap gap-1.5 pt-1">
              {existingTags
                .filter((t) => !tags.includes(t))
                .map((t) => (
                  <button key={t} type="button" onClick={() => toggleTag(t)} className="rounded-full border border-line bg-surface px-2.5 py-1 text-xs text-ink-2 hover:border-accent">
                    + {t}
                  </button>
                ))}
            </div>
          )}
        </div>

        <div className="flex flex-col gap-1.5">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Nội dung (Markdown)</span>
            <button type="button" onClick={() => setPreview((p) => !p)} className="inline-flex items-center gap-1.5 rounded-md border border-line bg-surface px-2.5 py-1 text-xs hover:border-accent">
              {preview ? <Pencil className="size-3.5" /> : <Eye className="size-3.5" />}
              {preview ? 'Viết' : 'Xem trước'}
            </button>
          </div>
          {preview ? (
            <article className="article min-h-[16rem] rounded-md border border-line bg-surface p-4">
              {content.trim() ? <Markdown remarkPlugins={[remarkGfm]}>{content}</Markdown> : <p className="text-sm text-muted">Chưa có nội dung.</p>}
            </article>
          ) : (
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="min-h-[16rem] w-full rounded-md border border-line bg-surface p-3 font-mono text-sm outline-none focus:border-accent"
              placeholder={'# Tiêu đề\n\nNội dung Markdown…'}
            />
          )}
        </div>

        {error && <p className="text-sm text-danger">{error}</p>}

        <div className="flex flex-wrap gap-2 border-t border-line pt-4">
          <Link href="/library" className="inline-flex items-center rounded-md border border-line bg-surface px-4 py-2 text-sm hover:border-accent">
            Hủy
          </Link>
          <button type="button" onClick={() => save('draft')} disabled={busy} className="inline-flex items-center rounded-md border border-line bg-surface px-4 py-2 text-sm hover:border-accent disabled:opacity-60">
            Lưu nháp
          </button>
          <button type="button" onClick={() => save('published')} disabled={busy} className="ml-auto inline-flex items-center rounded-md bg-accent px-4 py-2 text-sm font-medium text-accent-ink hover:opacity-90 disabled:opacity-60">
            {busy ? 'Đang lưu…' : 'Xuất bản'}
          </button>
        </div>
      </div>
    </div>
  );
}
