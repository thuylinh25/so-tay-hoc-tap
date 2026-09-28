import type { Metadata } from 'next';
import { Quiz } from '@/components/practice/quiz';

export const metadata: Metadata = { title: 'Quiz' };

export default function Page() {
  return <Quiz />;
}
