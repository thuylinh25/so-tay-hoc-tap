// Auth admin cho Pages Functions: mật khẩu (secret ADMIN_PASSWORD) đổi lấy cookie httpOnly ký HMAC.
// Mọi endpoint ghi (POST/PUT/DELETE) và đọc draft đều gọi requireAdmin() ở server-side.

export interface Env {
  DB: D1Database;
  ADMIN_PASSWORD: string;
  SESSION_SECRET: string;
  ASSETS: Fetcher;
}

export interface Ctx<P extends string = string> {
  request: Request;
  env: Env;
  params: Record<P, string>;
  next: (input?: Request | string, init?: RequestInit) => Promise<Response>;
  waitUntil: (p: Promise<unknown>) => void;
}

export const COOKIE = 'sid';
const TTL_MS = 30 * 24 * 60 * 60 * 1000; // 30 ngày

const enc = new TextEncoder();

function b64url(bytes: ArrayBuffer | Uint8Array): string {
  const b = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes);
  let s = '';
  for (const byte of b) s += String.fromCharCode(byte);
  return btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

async function hmac(secret: string, data: string): Promise<string> {
  const key = await crypto.subtle.importKey('raw', enc.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const sig = await crypto.subtle.sign('HMAC', key, enc.encode(data));
  return b64url(sig);
}

// So sánh hằng thời gian để tránh timing attack.
function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let out = 0;
  for (let i = 0; i < a.length; i++) out |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return out === 0;
}

/** Tạo token phiên: "<exp>.<hmac(exp|admin)>". */
export async function createSession(secret: string): Promise<string> {
  const exp = Date.now() + TTL_MS;
  const sig = await hmac(secret, `${exp}|admin`);
  return `${exp}.${sig}`;
}

export async function verifySession(token: string | null, secret: string): Promise<boolean> {
  if (!token) return false;
  const dot = token.indexOf('.');
  if (dot < 0) return false;
  const exp = Number(token.slice(0, dot));
  const sig = token.slice(dot + 1);
  if (!Number.isFinite(exp) || exp < Date.now()) return false;
  const expected = await hmac(secret, `${exp}|admin`);
  return timingSafeEqual(sig, expected);
}

export function getCookie(request: Request, name: string): string | null {
  const header = request.headers.get('Cookie');
  if (!header) return null;
  for (const part of header.split(/;\s*/)) {
    const eq = part.indexOf('=');
    if (eq > -1 && part.slice(0, eq) === name) return decodeURIComponent(part.slice(eq + 1));
  }
  return null;
}

export async function isAdmin(ctx: Ctx): Promise<boolean> {
  return verifySession(getCookie(ctx.request, COOKIE), ctx.env.SESSION_SECRET);
}

export function sessionCookie(token: string, secure = true): string {
  const parts = [`${COOKIE}=${token}`, 'Path=/', 'HttpOnly', 'SameSite=Lax', `Max-Age=${Math.floor(TTL_MS / 1000)}`];
  if (secure) parts.push('Secure');
  return parts.join('; ');
}

export function clearCookie(): string {
  return `${COOKIE}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0`;
}

export function checkPassword(input: unknown, env: Env): boolean {
  return typeof input === 'string' && typeof env.ADMIN_PASSWORD === 'string' && env.ADMIN_PASSWORD.length > 0 && timingSafeEqual(input, env.ADMIN_PASSWORD);
}

export function json(data: unknown, init: ResponseInit = {}): Response {
  return new Response(JSON.stringify(data), {
    ...init,
    headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store', ...(init.headers ?? {}) },
  });
}

export const unauthorized = () => json({ error: 'unauthorized' }, { status: 401 });
export const badRequest = (msg: string) => json({ error: msg }, { status: 400 });
