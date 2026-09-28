import Link from 'next/link';
import type { ReactNode } from 'react';
import { PageHeader } from './ui';

export function ComingSoon({ title, children, sources }: { title: string; children: ReactNode; sources?: { slug: string; label: string }[] }) {
  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6 px-4 py-8 sm:px-8">
      <PageHeader eyebrow="Sắp có" title={title}>
        {children}
      </PageHeader>
      {sources && (
        <section className="flex flex-col gap-2">
          <h2 className="eyebrow">Nguồn dữ liệu sẽ dùng</h2>
          <ul className="flex flex-col gap-1.5 text-sm">
            {sources.map((s) => (
              <li key={s.slug}>
                <Link href={`/learn/${s.slug}`} className="text-accent underline underline-offset-2">
                  {s.label}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
