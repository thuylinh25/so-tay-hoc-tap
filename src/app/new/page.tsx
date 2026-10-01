import type { Metadata } from 'next';
import { ArticleForm } from '@/components/pages/article-form';

export const metadata: Metadata = { title: 'Bài viết mới' };

export default function NewArticlePage() {
  return <ArticleForm />;
}
