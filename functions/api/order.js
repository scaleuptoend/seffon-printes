import { json, db, authed, body } from "../_lib.js";

export async function onRequest({ request, env }) {
  try {
    const D = await db(env);
    // Public: customer places an order
    if (request.method === "POST") {
      const b = await body(request);
      const items = (Array.isArray(b.items) ? b.items : []).slice(0, 100)
        .map((x) => ({ n: String(x.n || "").slice(0, 80), q: Math.max(1, parseInt(x.q) || 1) }));
      const name = String(b.name || "").trim().slice(0, 80);
      const phone = String(b.phone || "").trim().slice(0, 20);
      const city = String(b.city || "").trim().slice(0, 80);
      if (!name || !phone || !items.length) return json({ error: "Missing details" }, 400);
      const t = Date.now(), id = t.toString(36) + Math.random().toString(36).slice(2, 6);
      const o = { id, t, name, phone, city, items, total: items.reduce((a, x) => a + x.q, 0), st: "new" };
      await D.batch([
        D.prepare("INSERT INTO orders (id, t, j) VALUES (?, ?, ?)").bind(id, t, JSON.stringify(o)),
        D.prepare("DELETE FROM orders WHERE id NOT IN (SELECT id FROM orders ORDER BY t DESC LIMIT 500)"),
      ]);
      return json({ ok: true, id });
    }
    // Admin only below
    if (!(await authed(request, env))) return json({ error: "Login required" }, 401);
    if (request.method === "GET") {
      const { results } = await D.prepare("SELECT j FROM orders ORDER BY t DESC LIMIT 500").all();
      return json(results.map((r) => JSON.parse(r.j)));
    }
    if (request.method === "PATCH") {
      const { id, del, st } = await body(request);
      if (del) { await D.prepare("DELETE FROM orders WHERE id=?").bind(String(id)).run(); return json({ ok: true }); }
      const r = await D.prepare("SELECT j FROM orders WHERE id=?").bind(String(id)).first();
      if (r) {
        const o = JSON.parse(r.j); o.st = st === "done" ? "done" : "new";
        await D.prepare("UPDATE orders SET j=? WHERE id=?").bind(JSON.stringify(o), String(id)).run();
      }
      return json({ ok: true });
    }
    return new Response(null, { status: 405 });
  } catch (e) { return json({ error: "Server error: " + e.message }, 500); }
}
