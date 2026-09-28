import manifestJson from '@/generated/manifest.json';

export type DocKind = 'markdown' | 'html' | 'pdf' | 'gallery';
export type Level = 'beginner' | 'intermediate' | 'advanced';

export interface Heading {
  id: string;
  text: string;
  depth: number;
  /** Vị trí trong danh sách h2/h3 của trang HTML nhúng. */
  index?: number;
}

export interface GalleryPage {
  id: string;
  label: string;
  src: string;
  width: number;
  height: number;
  n: number;
}

export interface Doc {
  slug: string;
  title: string;
  subtitle: string | null;
  domain: string;
  topic: string;
  level: Level;
  tags: string[];
  order: number;
  source: string;
  kind: DocKind;
  related: string[];
  note: string | null;
  headings: Heading[];
  pages?: GalleryPage[];
  file?: string;
  questions?: string[];
  attachments: { label: string; url: string }[];
  stats: { words?: number; minutes?: number; codeBlocks?: number; pages?: number; questions?: number };
}

export interface Domain {
  id: string;
  title: string;
  description: string;
}
export interface Topic {
  id: string;
  domain: string;
  title: string;
}
export interface Roadmap {
  id: string;
  title: string;
  description: string;
  steps: string[];
}

interface Manifest {
  generatedAt: string;
  domains: Domain[];
  topics: Topic[];
  docs: Doc[];
  roadmaps: Roadmap[];
}

const manifest = manifestJson as unknown as Manifest;

export const domains = manifest.domains;
export const topics = manifest.topics;
export const docs = manifest.docs;
export const roadmaps = manifest.roadmaps;

const docBySlug = new Map(docs.map((d) => [d.slug, d]));
export const getDoc = (slug: string) => docBySlug.get(slug);
export const getDomain = (id: string) => domains.find((d) => d.id === id);
export const getTopic = (id: string) => topics.find((t) => t.id === id);
export const getRoadmap = (id: string) => roadmaps.find((r) => r.id === id);

export const docsInDomain = (domainId: string) => docs.filter((d) => d.domain === domainId);
export const docsInTopic = (topicId: string) => docs.filter((d) => d.topic === topicId);
export const topicsInDomain = (domainId: string) => topics.filter((t) => t.domain === domainId);

/** Thứ tự đọc: theo domain → topic → thứ tự khai báo. */
export const readingOrder: Doc[] = domains.flatMap((dm) => topicsInDomain(dm.id).flatMap((t) => docsInTopic(t.id)));

export function neighbours(slug: string) {
  const i = readingOrder.findIndex((d) => d.slug === slug);
  return { prev: i > 0 ? readingOrder[i - 1] : null, next: i >= 0 && i < readingOrder.length - 1 ? readingOrder[i + 1] : null };
}

/** Heading hiển thị trong mục lục (bỏ bậc quá sâu). */
export const tocHeadings = (doc: Doc) => doc.headings.filter((h) => h.depth >= 2 && h.depth <= 3);

export const levelLabel: Record<Level, string> = {
  beginner: 'Cơ bản',
  intermediate: 'Trung cấp',
  advanced: 'Nâng cao',
};

export const kindLabel: Record<DocKind, string> = {
  markdown: 'Bài học',
  html: 'Bài học',
  pdf: 'PDF',
  gallery: 'Sổ tay ảnh',
};

export function docSummary(doc: Doc) {
  const s = doc.stats;
  if (doc.kind === 'gallery') return `${s.pages} trang`;
  if (doc.kind === 'pdf') return s.questions ? `${s.questions} câu hỏi` : 'PDF';
  return `${s.minutes} phút đọc`;
}
