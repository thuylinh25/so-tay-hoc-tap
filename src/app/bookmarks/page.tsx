import type { Metadata } from 'next';
import { BookmarksPage } from '@/components/pages/collections';

export const metadata: Metadata = { title: 'Bookmark' };

export default function Page() {
  return <BookmarksPage />;
}
