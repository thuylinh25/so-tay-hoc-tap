import type { Metadata } from 'next';
import { Flashcards } from '@/components/practice/flashcards';

export const metadata: Metadata = { title: 'Flashcards' };

export default function Page() {
  return <Flashcards />;
}
