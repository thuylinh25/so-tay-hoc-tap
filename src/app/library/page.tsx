import type { Metadata } from 'next';
import { Library } from '@/components/pages/library';

export const metadata: Metadata = { title: 'Thư viện' };

export default function LibraryPage() {
  return <Library />;
}
