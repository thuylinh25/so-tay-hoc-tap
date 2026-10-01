import { type Ctx } from '../_lib/auth';

// Hybrid /learn/<slug>: bài static (có file trong out/) phục vụ như cũ; slug không có file
// -> coi là bài động (D1), trả shell client /article (đọc slug từ path, fetch /api/articles/<slug>,
// render markdown + bật bookmark/đã đọc bằng store sẵn có). Giữ nguyên URL /learn/<slug>.
export const onRequest = async (ctx: Ctx): Promise<Response> => {
  const asset = await ctx.next();
  if (asset.status !== 404) return asset;
  const shell = await ctx.next('/article/');
  return new Response(shell.body, {
    status: 200,
    headers: { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store' },
  });
};
