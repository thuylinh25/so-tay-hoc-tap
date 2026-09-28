import type { Metadata } from 'next';
import { Interview } from '@/components/practice/interview';

export const metadata: Metadata = { title: 'Phỏng vấn' };

export default function Page() {
  return <Interview />;
}
