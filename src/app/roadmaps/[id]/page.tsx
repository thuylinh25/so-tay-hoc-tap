import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getRoadmap, roadmaps } from '@/lib/content';
import { RoadmapDetail } from '@/components/pages/roadmaps';

export const dynamicParams = false;

export function generateStaticParams() {
  return roadmaps.map((r) => ({ id: r.id }));
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  return { title: getRoadmap(id)?.title ?? 'Lộ trình' };
}

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!getRoadmap(id)) notFound();
  return <RoadmapDetail id={id} />;
}
