import { type Ctx, checkPassword, createSession, sessionCookie, json, badRequest } from '../_lib/auth';

export const onRequestPost = async (ctx: Ctx): Promise<Response> => {
  let body: unknown;
  try {
    body = await ctx.request.json();
  } catch {
    return badRequest('JSON không hợp lệ');
  }
  const password = (body as Record<string, unknown>)?.password;
  if (!checkPassword(password, ctx.env)) return json({ error: 'Sai mật khẩu' }, { status: 401 });
  const token = await createSession(ctx.env.SESSION_SECRET);
  const secure = new URL(ctx.request.url).protocol === 'https:';
  return json({ ok: true }, { headers: { 'Set-Cookie': sessionCookie(token, secure) } });
};
