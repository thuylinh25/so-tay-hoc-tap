import type { Metadata } from 'next';
import { NotesPage } from '@/components/pages/collections';

export const metadata: Metadata = { title: 'Ghi chú' };

export default function Page() {
  return <NotesPage />;
}
