import { json, db, authed, body } from "../_lib.js";
const CATS = ["dupattas", "hijabs", "scarfs", "stoles"];
const IMG = /^data:image\/(jpeg|png|webp);base64,/;

export async function onRequest({ request, env }) {
  try {
    const D = await db(env);
    if (request.method === "GET") {
      const s = await D.prepare("SELECT v FROM kv WHERE k='settings'").first();
      const { results } = await D.prepare("SELECT j FROM products").all();
      return json({ s: s ? JSON.parse(s.v) : null, p: results.map((r) => JSON.parse(r.j)) });
    }
    if (request.method === "POST") {
      if (!(await authed(request, env))) return json({ error: "Login required" }, 401);
      const b = await body(request), S = b.s || {}, L = Array.isArray(b.p) ? b.p : [];
      const s = {
        min: Math.max(1, parseInt(S.min) || 12),
        step: Math.max(1, parseInt(S.step) || 12),
        wa: String(S.wa || "").replace(/\D/g, "").slice(0, 15) || "919629737237",
      };
      const old = (await D.prepare("SELECT id FROM products").all()).results.map((r) => r.id);
      const st = [D.prepare("INSERT OR REPLACE INTO kv (k, v) VALUES ('settings', ?)").bind(JSON.stringify(s))], keep = {};
      L.slice(0, 300).forEach((x) => {
        const id = String(x.id || "").replace(/[^\w-]/g, "").slice(0, 30);
        if (!id) return;
        keep[id] = 1;
        const p = {
          id, c: CATS.includes(x.c) ? x.c : CATS[0], n: String(x.n || "").slice(0, 80),
          h: /^#[0-9a-f]{6}$/i.test(x.h) ? x.h : "#9b1c4b", pr: Math.max(0, parseInt(x.pr) || 0),
          o: x.o ? 1 : 0, i: x.i ? 1 : 0, v: parseInt(x.v) || 0,
        };
        if (typeof x.img === "string" && IMG.test(x.img) && x.img.length < 400000) {
          p.i = 1; p.v = Date.now();
          st.push(D.prepare("INSERT OR REPLACE INTO imgs (id, d) VALUES (?, ?)").bind(id, x.img));
        }
        st.push(D.prepare("INSERT OR REPLACE INTO products (id, j) VALUES (?, ?)").bind(id, JSON.stringify(p)));
      });
      old.filter((k) => !keep[k]).forEach((k) => {
        st.push(D.prepare("DELETE FROM products WHERE id=?").bind(k));
        st.push(D.prepare("DELETE FROM imgs WHERE id=?").bind(k));
      });
      await D.batch(st);
      return json({ ok: true });
    }
    return new Response(null, { status: 405 });
  } catch (e) { return json({ error: "Server error: " + e.message }, 500); }
}
