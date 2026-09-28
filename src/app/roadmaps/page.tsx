import type { Metadata } from 'next';
import { RoadmapsIndex } from '@/components/pages/roadmaps';

export const metadata: Metadata = { title: 'Lộ trình' };

export default function Page() {
  return <RoadmapsIndex />;
}
