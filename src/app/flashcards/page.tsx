import type { Metadata } from 'next';
import { ComingSoon } from '@/components/coming-soon';

export const metadata: Metadata = { title: 'Flashcards' };

export default function Page() {
  return (
    <ComingSoon title="Flashcards">
      Thẻ ôn tập lặp lại ngắt quãng (Again / Hard / Good / Easy), tạo từ các mục “Bài tập” và “Đáp án” trong 4 giáo trình Markdown. Chưa có thẻ nào, và app sẽ không tự bịa nội dung thẻ.
    </ComingSoon>
  );
}
