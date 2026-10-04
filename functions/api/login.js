import { json, mint, hmac, same, body } from "../_lib.js";

export async function onRequestPost({ request, env }) {
  const pw = env.ADMIN_PASSWORD;
  const given = String((await body(request)).password || "");
  if (!pw || !same(await hmac("chk", given), await hmac("chk", pw))) {
    await new Promise((r) => setTimeout(r, 800));
    return json({ error: pw ? "Wrong password" : "ADMIN_PASSWORD is not set in Cloudflare" }, 401);
  }
  return json({ token: await mint(env) });
}
