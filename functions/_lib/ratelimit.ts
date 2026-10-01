import type { Env } from './auth';

// Rate limit cửa sổ cố định trên D1. Trả true nếu được phép, false nếu vượt hạn mức.
// Dùng cho endpoint tốn phí (classify). Không chặn toàn site.
export async function allow(env: Env, bucket: string, limit: number, windowMs: number, now: number): Promise<boolean> {
  const row = await env.DB.prepare('SELECT count, resetAt FROM rate_limit WHERE bucket = ?').bind(bucket).first<{ count: number; resetAt: number }>();
  if (!row || now >= row.resetAt) {
    const resetAt = now + windowMs;
    await env.DB.prepare('INSERT INTO rate_limit (bucket,count,resetAt) VALUES (?,1,?) ON CONFLICT(bucket) DO UPDATE SET count=1, resetAt=?')
      .bind(bucket, resetAt, resetAt)
      .run();
    return true;
  }
  if (row.count >= limit) return false;
  await env.DB.prepare('UPDATE rate_limit SET count = count + 1 WHERE bucket = ?').bind(bucket).run();
  return true;
}
