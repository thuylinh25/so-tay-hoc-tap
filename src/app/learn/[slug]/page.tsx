import fs from 'node:fs';
import path from 'node:path';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { docs, getDoc } from '@/lib/content';
import { Reader } from '@/components/reader/reader';

export const dynamicParams = false;

export function generateStaticParams() {
  return docs.map((d) => ({ slug: d.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  return { title: getDoc(slug)?.title ?? 'Không tìm thấy' };
}

export default async function LearnPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const doc = getDoc(slug);
  if (!doc) notFound();
  const html = doc.kind === 'markdown' ? fs.readFileSync(path.join(process.cwd(), 'src', 'generated', 'html', `${slug}.html`), 'utf8') : null;
  // key: mỗi bài một instance Reader, không giữ state (mục active, tiến độ) của bài trước.
  return <Reader key={slug} slug={slug} html={html} />;
}
