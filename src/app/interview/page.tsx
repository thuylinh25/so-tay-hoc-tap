import type { Metadata } from 'next';
import { ComingSoon } from '@/components/coming-soon';

export const metadata: Metadata = { title: 'Phỏng vấn' };

export default function Page() {
  return (
    <ComingSoon
      title="Luyện phỏng vấn"
      sources={[
        { slug: 'automation-interview-3-5-nam', label: 'Phỏng vấn Automation Test Engineer (3–5 năm) — 15 câu' },
        { slug: 'sql-50-interview', label: '50 câu phỏng vấn SQL (dạng ảnh, cần OCR)' },
      ]}
    >
      Chọn chủ đề (Java, SQL, Automation…), cấp độ và số câu (10 / 20 / 30), rồi luyện trả lời. Chỉ dùng câu hỏi có sẵn trong tài liệu.
    </ComingSoon>
  );
}
