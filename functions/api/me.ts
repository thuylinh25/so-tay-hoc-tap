import { type Ctx, isAdmin, json } from '../_lib/auth';

export const onRequestGet = async (ctx: Ctx): Promise<Response> => json({ admin: await isAdmin(ctx) });
