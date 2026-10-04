import { db } from "../_lib.js";

export async function onRequestGet({ request, env }) {
  try {
    const D = await db(env);
    const id = new URL(request.url).searchParams.get("id") || "";
    const r = await D.prepare("SELECT d FROM imgs WHERE id=?").bind(id).first();
    const m = r && r.d.match(/^data:(image\/(?:jpeg|png|webp));base64,(.+)$/);
    if (!m) return new Response(null, { status: 404 });
    const bin = atob(m[2]);
    const bytes = Uint8Array.from(bin, (c) => c.charCodeAt(0));
    return new Response(bytes, {
      headers: { "Content-Type": m[1], "X-Content-Type-Options": "nosniff", "Cache-Control": "public, max-age=31536000, immutable" },
    });
  } catch (e) { return new Response(null, { status: 500 }); }
}
