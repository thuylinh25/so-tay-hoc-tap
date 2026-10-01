import { type Ctx, clearCookie, json } from '../_lib/auth';

export const onRequestPost = async (): Promise<Response> => json({ ok: true }, { headers: { 'Set-Cookie': clearCookie() } });

// Cho phép gọi GET để đăng xuất nhanh.
export const onRequestGet = async (ctx: Ctx): Promise<Response> => {
  void ctx;
  return json({ ok: true }, { headers: { 'Set-Cookie': clearCookie() } });
};
