import type { Metadata } from 'next';
import { ComingSoon } from '@/components/coming-soon';

export const metadata: Metadata = { title: 'Quiz' };

export default function Page() {
  return (
    <ComingSoon title="Quiz">
      Câu hỏi trắc nghiệm kèm giải thích và nguồn, chấm điểm và chỉ ra chủ đề còn yếu. Câu hỏi sẽ lấy từ bài tập có đáp án trong tài liệu thật.
    </ComingSoon>
  );
}
