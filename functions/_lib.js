// Shared helpers for Cloudflare Pages Functions (D1 database + admin login)
const enc = new TextEncoder();
let ready = false;

export const json = (o, status = 200) =>
  new Response(JSON.stringify(o), {
    status,
    headers: { "Content-Type": "application/json", "Cache-Control": "no-store" },
  });

// Returns the D1 database; creates the tables the first time
export async function db(env) {
  if (!env.DB) throw new Error("Database not connected (add D1 binding named DB)");
  if (!ready) {
    await env.DB.batch([
      env.DB.prepare("CREATE TABLE IF NOT EXISTS kv (k TEXT PRIMARY KEY, v TEXT)"),
      env.DB.prepare("CREATE TABLE IF NOT EXISTS products (id TEXT PRIMARY KEY, j TEXT)"),
      env.DB.prepare("CREATE TABLE IF NOT EXISTS imgs (id TEXT PRIMARY KEY, d TEXT)"),
      env.DB.prepare("CREATE TABLE IF NOT EXISTS orders (id TEXT PRIMARY KEY, t INTEGER, j TEXT)"),
    ]);
    ready = true;
  }
  return env.DB;
}

export async function hmac(key, msg) {
  const k = await crypto.subtle.importKey("raw", enc.encode(key || "x"), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const s = await crypto.subtle.sign("HMAC", k, enc.encode(String(msg)));
  return [...new Uint8Array(s)].map((b) => b.toString(16).padStart(2, "0")).join("");
}
export function same(a, b) {
  if (a.length !== b.length) return false;
  let r = 0;
  for (let i = 0; i < a.length; i++) r |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return r === 0;
}
export async function mint(env) {
  const e = Date.now() + 12 * 3600 * 1000;
  return e + "." + (await hmac(env.ADMIN_PASSWORD, e));
}
export async function authed(request, env) {
  if (!env.ADMIN_PASSWORD) return false;
  const t = (request.headers.get("x-token") || "").split(".");
  if (t.length !== 2 || Number(t[0]) < Date.now()) return false;
  return same(t[1], await hmac(env.ADMIN_PASSWORD, t[0]));
}
export async function body(request) {
  try { return await request.json(); } catch (e) { return {}; }
}
