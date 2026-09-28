import type { Metadata, Viewport } from 'next';
import { Be_Vietnam_Pro, IBM_Plex_Sans, JetBrains_Mono } from 'next/font/google';
import { AppShell } from '@/components/shell/app-shell';
import { themeInitScript } from '@/lib/theme';
import './globals.css';

const heading = Be_Vietnam_Pro({ subsets: ['latin', 'vietnamese'], weight: ['500', '600', '700'], variable: '--font-heading', display: 'swap' });
const body = IBM_Plex_Sans({ subsets: ['latin', 'vietnamese'], weight: ['400', '500', '600'], style: ['normal', 'italic'], variable: '--font-body', display: 'swap' });
const code = JetBrains_Mono({ subsets: ['latin', 'vietnamese'], weight: ['400', '500'], variable: '--font-code', display: 'swap' });

export const metadata: Metadata = {
  title: { default: 'Sổ tay học tập', template: '%s · Sổ tay học tập' },
  description: 'Kho kiến thức cá nhân: Java, Automation Testing, Web, SQL và Khoa học máy tính.',
  robots: { index: false, follow: false },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="vi" suppressHydrationWarning className={`${heading.variable} ${body.variable} ${code.variable}`}>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body>
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
