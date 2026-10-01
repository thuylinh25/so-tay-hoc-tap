import type { Metadata } from 'next';
import { DynamicReader } from '@/components/pages/dynamic-reader';

export const metadata: Metadata = { title: 'Bài viết' };

// Shell tĩnh cho bài động. Pages Function /learn/<slug> phục vụ trang này khi slug không phải bài static;
// cũng truy cập trực tiếp được qua /article?slug=<slug>.
export default function ArticlePage() {
  return <DynamicReader />;
}
