import type { NextConfig } from 'next';

// Xuất web tĩnh (thư mục out/) để deploy lên Cloudflare Pages.
const nextConfig: NextConfig = {
  output: 'export',
  images: { unoptimized: true },
  turbopack: { root: process.cwd() },
};

export default nextConfig;
