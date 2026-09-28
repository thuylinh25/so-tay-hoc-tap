import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="mx-auto flex max-w-xl flex-col items-start gap-3 px-4 py-20 sm:px-8">
      <div className="eyebrow">404</div>
      <h1 className="font-display text-2xl font-bold">Không tìm thấy trang</h1>
      <p className="text-ink-2">Tài liệu có thể đã đổi tên. Thử tìm bằng Ctrl K, hoặc quay lại thư viện.</p>
      <Link href="/library" className="text-accent underline underline-offset-2">
        Về Thư viện
      </Link>
    </div>
  );
}
