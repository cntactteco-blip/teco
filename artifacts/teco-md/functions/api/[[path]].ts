/**
 * Cloudflare Pages Function — catch-all pentru /api/*
 * Înlocuiește complet api-server-ul Replit.
 * Baza de date: Cloudflare D1 (SQLite distribuit, gratuit permanent).
 */

import { Hono } from "hono";
import { handle } from "hono/cloudflare-pages";

// ─── Tipuri ─────────────────────────────────────────────────────────────────

interface Env {
  DB: D1Database;
  TELEGRAM_BOT_TOKEN?: string;
  TELEGRAM_CHAT_ID?: string;
  SESSION_SECRET?: string;
}

interface SessionInfo {
  sessionId?: string;
  startedAt?: number;
  pages?: { path: string; title?: string; ts: number }[];
  referrer?: string;
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
  country?: string;
  city?: string;
  isp?: string;
  deviceType?: string;
  browser?: string;
  duration?: number;
}

// ─── Helpers generali ────────────────────────────────────────────────────────

function chisinauDate(offsetDays = 0): string {
  return new Intl.DateTimeFormat("sv-SE", { timeZone: "Europe/Chisinau" }).format(
    new Date(Date.now() + offsetDays * 86_400_000),
  );
}

function esc(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function flag(country: string): string {
  const map: Record<string, string> = {
    Moldova: "🇲🇩", Romania: "🇷🇴", Germany: "🇩🇪", Italy: "🇮🇹",
    France: "🇫🇷", "United Kingdom": "🇬🇧", "United States": "🇺🇸",
    Ukraine: "🇺🇦", Russia: "🇷🇺", Israel: "🇮🇱", Spain: "🇪🇸",
    Portugal: "🇵🇹", Netherlands: "🇳🇱", Belgium: "🇧🇪",
    Austria: "🇦🇹", Switzerland: "🇨🇭", Canada: "🇨🇦", Australia: "🇦🇺",
  };
  return map[country] || "🌍";
}

function formatSource(referrer: string, utmSource: string, utmMedium: string): string {
  if (utmSource) return `${utmSource}${utmMedium ? ` (${utmMedium})` : ""}`;
  if (!referrer) return "Direct / Bookmark";
  try {
    const host = new URL(referrer).hostname;
    if (host.includes("google")) return "Google";
    if (host.includes("facebook") || host.includes("fb.com")) return "Facebook";
    if (host.includes("instagram")) return "Instagram";
    if (host.includes("tiktok")) return "TikTok";
    if (host.includes("youtube")) return "YouTube";
    return host;
  } catch { return "Direct"; }
}

function formatTime(ts: number): string {
  return new Date(ts).toLocaleTimeString("ro-MD", {
    hour: "2-digit", minute: "2-digit", timeZone: "Europe/Chisinau",
  });
}

function formatDur(seconds: number): string {
  if (seconds < 60) return `${seconds}s`;
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return s > 0 ? `${m}m ${s}s` : `${m}m`;
}

// ─── D1 helpers ──────────────────────────────────────────────────────────────

/** Rate limit: returnează true dacă acțiunea este permisă (sub limită). */
async function checkRateLimit(
  db: D1Database,
  key: string,
  date: string,
  type: string,
  limit: number,
): Promise<boolean> {
  try {
    const result = await db
      .prepare(
        `INSERT INTO ip_rate_limits (ip, date, type, count) VALUES (?, ?, ?, 1)
         ON CONFLICT(ip, date, type) DO UPDATE SET count = count + 1
         RETURNING count`,
      )
      .bind(key, date, type)
      .first<{ count: number }>();
    return (result?.count ?? 1) <= limit;
  } catch {
    return true;
  }
}

// ─── Telegram ────────────────────────────────────────────────────────────────

async function sendTelegram(env: Env, text: string): Promise<void> {
  const token = env.TELEGRAM_BOT_TOKEN;
  const chatId = env.TELEGRAM_CHAT_ID;
  if (!token || !chatId) return;
  try {
    const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: chatId,
        text: text.slice(0, 4096),
        parse_mode: "HTML",
        disable_web_page_preview: true,
      }),
    });
    const data = (await res.json()) as { ok: boolean; description?: string };
    if (!data.ok) console.error("Telegram:", data.description);
  } catch (err) {
    console.error("Telegram send failed:", err);
  }
}

async function notifyVisitor(env: Env, session: SessionInfo): Promise<void> {
  const loc = [session.city, session.country].filter(Boolean).join(", ");
  const src = formatSource(session.referrer || "", session.utmSource || "", session.utmMedium || "");
  const dev = session.deviceType === "mobile" ? "📱 Mobil" : session.deviceType === "tablet" ? "📊 Tabletă" : "💻 Desktop";
  const page = session.pages?.[0]?.path || "/";
  const time = formatTime(session.startedAt || Date.now());

  await sendTelegram(env, [
    `🔔 <b>Vizitator Nou pe Teco.md</b>`,
    ``,
    `🕐 ${time}  ${flag(session.country || "")} <b>${esc(loc || "Locație necunoscută")}</b>`,
    `🌐 Sursă: <b>${esc(src)}</b>`,
    `📄 Pagină: <code>${esc(page)}</code>`,
    `${dev}  |  ${esc(session.browser || "Browser")}`,
    session.isp ? `🔌 ${esc(session.isp)}` : "",
  ].filter(Boolean).join("\n"));
}

async function notifyFirstMessage(env: Env, payload: {
  message: string; page: string; session: SessionInfo;
}): Promise<void> {
  const { message, page, session } = payload;
  const loc = [session.city, session.country].filter(Boolean).join(", ");
  const src = formatSource(session.referrer || "", session.utmSource || "", session.utmMedium || "");
  await sendTelegram(env, [
    `💬 <b>TecoBot — Mesaj Nou</b>`,
    ``,
    `🕐 ${formatTime(session.startedAt || Date.now())}  ${flag(session.country || "")} <b>${esc(loc || "Locație necunoscută")}</b>`,
    `🌐 Sursă: ${esc(src)}`,
    `📄 Pagina: <code>${esc(page)}</code>`,
    ``,
    `👤 <i>"${esc(message)}"</i>`,
  ].join("\n"));
}

async function notifyLeadChat(env: Env, payload: {
  name: string; phone: string;
  messages: { role: "user" | "assistant"; content: string }[];
  session: SessionInfo;
}): Promise<void> {
  const { name, phone, messages, session } = payload;
  const loc = [session.city, session.country].filter(Boolean).join(", ");
  const src = formatSource(session.referrer || "", session.utmSource || "", session.utmMedium || "");
  const dur = formatDur(session.duration ?? 0);
  const dev = session.deviceType === "mobile" ? "📱" : "💻";
  const pagesText = (session.pages || []).map((p) => `• ${esc(p.path)}`).slice(0, 8).join("\n") || "• /";
  const transcript = messages
    .filter((m) => !m.content.includes("LEAD_CAPTURED"))
    .slice(-20)
    .map((m) => {
      const role = m.role === "user" ? "👤" : "🤖";
      const text = m.content.replace(/LEAD_CAPTURED:[^\n]*/g, "").trim().slice(0, 300);
      return `${role} ${esc(text)}`;
    })
    .join("\n");
  await sendTelegram(env, [
    `🤖 <b>Lead Nou — TecoBot AI</b>`,
    ``,
    `👤 <b>${esc(name)}</b>  |  📞 <code>${esc(phone)}</code>`,
    ``,
    `🕐 ${formatTime(session.startedAt || Date.now())}  ${flag(session.country || "")} ${esc(loc || "?")}  ${dev}`,
    `🌐 Sursă: ${esc(src)}  |  ⏱ ${dur} pe site`,
    ``,
    `📄 <b>Pagini vizitate:</b>`,
    pagesText,
    ``,
    `💬 <b>Conversație:</b>`,
    `─────────────────`,
    transcript,
    `─────────────────`,
  ].join("\n"));
}

async function notifyLeadCalculator(env: Env, payload: {
  name: string; phone: string;
  selections: { objective?: string; cameras?: string; storage?: string; installation?: string };
  equipmentCost: number; installCost: number; totalCost: number;
  session: SessionInfo;
}): Promise<void> {
  const { name, phone, selections, equipmentCost, installCost, totalCost, session } = payload;
  const loc = [session.city, session.country].filter(Boolean).join(", ");
  const src = formatSource(session.referrer || "", session.utmSource || "", session.utmMedium || "");
  const dur = formatDur(session.duration ?? 0);
  const pagesSummary = (session.pages || []).map((p) => p.path).slice(0, 5).join(" → ") || "/";
  await sendTelegram(env, [
    `🧮 <b>Lead Nou — Calculator Cost</b>`,
    ``,
    `👤 <b>${esc(name || "Anonim")}</b>  |  📞 <code>${esc(phone)}</code>`,
    ``,
    `🕐 ${formatTime(session.startedAt || Date.now())}  ${flag(session.country || "")} ${esc(loc || "?")}`,
    `🌐 Sursă: ${esc(src)}  |  ⏱ ${dur} pe site`,
    ``,
    `🎯 <b>Ce vrea clientul:</b>`,
    `• Obiectiv: ${esc(selections.objective || "—")}`,
    `• Camere: ${esc(selections.cameras || "—")}`,
    `• Stocare: ${esc(selections.storage || "—")}`,
    `• Instalare: ${esc(selections.installation || "—")}`,
    ``,
    `💰 <b>Estimare calculată:</b>`,
    `• Echipament: ~${equipmentCost.toLocaleString("ro-MD")} MDL`,
    `• Instalare: ~${installCost.toLocaleString("ro-MD")} MDL`,
    `• <b>Total: ~${totalCost.toLocaleString("ro-MD")} MDL</b>`,
    ``,
    `📄 Pagini: <i>${esc(pagesSummary)}</i>`,
  ].join("\n"));
}


// ─── App Hono ────────────────────────────────────────────────────────────────

const app = new Hono<{ Bindings: Env }>().basePath("/api");

// ── In-memory dedup (per-isolate, pierdut la cold-start — D1 e sursa de adevăr)
const notifiedSessions = new Set<string>();
const chatNotifyCounts = new Map<string, number>();
const CHAT_NOTIFY_LIMIT = 3;
const VISITOR_IP_DAILY_LIMIT = 1;
const LEAD_PHONE_DAILY_LIMIT = 1;

// ─── Settings ────────────────────────────────────────────────────────────────

app.get("/settings", async (c) => {
  const row = await c.env.DB.prepare("SELECT data FROM settings WHERE id = 1").first<{ data: string }>();
  const data = row ? JSON.parse(row.data) : null;
  return c.json({ data });
});

app.post("/settings", async (c) => {
  const body = await c.req.json();
  await c.env.DB.prepare(
    `INSERT INTO settings (id, data) VALUES (1, ?)
     ON CONFLICT(id) DO UPDATE SET data = excluded.data`,
  ).bind(JSON.stringify(body)).run();
  return c.json({ ok: true });
});

// ─── Products ─────────────────────────────────────────────────────────────────

app.get("/products", async (c) => {
  const { results } = await c.env.DB.prepare("SELECT * FROM products ORDER BY id ASC").all();
  const data = results.map((r: any) => ({
    ...r,
    images: typeof r.images === "string" ? JSON.parse(r.images || "[]") : (r.images ?? []),
    in_stock: r.in_stock === 1 || r.in_stock === true,
  }));
  return c.json({ data });
});

app.post("/products", async (c) => {
  const body = await c.req.json();
  const items: any[] = Array.isArray(body) ? body : [body];
  const stmt = c.env.DB.prepare(
    `INSERT INTO products
       (id, name, model, brand, price, old_price, specs, badge, category, image_url,
        images, description, long_description, tech_specs, in_stock, icon)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
     ON CONFLICT(id) DO UPDATE SET
       name=excluded.name, model=excluded.model, brand=excluded.brand,
       price=excluded.price, old_price=excluded.old_price, specs=excluded.specs,
       badge=excluded.badge, category=excluded.category, image_url=excluded.image_url,
       images=excluded.images, description=excluded.description,
       long_description=excluded.long_description, tech_specs=excluded.tech_specs,
       in_stock=excluded.in_stock, icon=excluded.icon`,
  );
  const stmts = items.map((p) =>
    stmt.bind(
      p.id, p.name ?? "", p.model ?? "", p.brand ?? "",
      p.price ?? 0, p.old_price ?? null,
      p.specs ?? "", p.badge ?? null,
      p.category ?? "", p.image_url ?? "",
      JSON.stringify(Array.isArray(p.images) ? p.images : []),
      p.description ?? "", p.long_description ?? null,
      p.tech_specs ?? null,
      p.in_stock === false || p.in_stock === 0 ? 0 : 1,
      p.icon ?? "camera",
    ),
  );
  await c.env.DB.batch(stmts);
  return c.json({ ok: true });
});

app.put("/products/:id", async (c) => {
  const body = await c.req.json();
  const id = Number(c.req.param("id"));
  const p = { ...body, id };
  await c.env.DB.prepare(
    `INSERT INTO products
       (id, name, model, brand, price, old_price, specs, badge, category, image_url,
        images, description, long_description, tech_specs, in_stock, icon)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
     ON CONFLICT(id) DO UPDATE SET
       name=excluded.name, model=excluded.model, brand=excluded.brand,
       price=excluded.price, old_price=excluded.old_price, specs=excluded.specs,
       badge=excluded.badge, category=excluded.category, image_url=excluded.image_url,
       images=excluded.images, description=excluded.description,
       long_description=excluded.long_description, tech_specs=excluded.tech_specs,
       in_stock=excluded.in_stock, icon=excluded.icon`,
  ).bind(
    p.id, p.name ?? "", p.model ?? "", p.brand ?? "",
    p.price ?? 0, p.old_price ?? null,
    p.specs ?? "", p.badge ?? null,
    p.category ?? "", p.image_url ?? "",
    JSON.stringify(Array.isArray(p.images) ? p.images : []),
    p.description ?? "", p.long_description ?? null,
    p.tech_specs ?? null,
    p.in_stock === false || p.in_stock === 0 ? 0 : 1,
    p.icon ?? "camera",
  ).run();
  return c.json({ ok: true });
});

app.delete("/products/:id", async (c) => {
  const id = Number(c.req.param("id"));
  await c.env.DB.prepare("DELETE FROM products WHERE id = ?").bind(id).run();
  return c.json({ ok: true });
});

// ─── Leads ────────────────────────────────────────────────────────────────────

app.get("/leads", async (c) => {
  const { results } = await c.env.DB.prepare(
    "SELECT * FROM leads ORDER BY timestamp DESC",
  ).all();
  const data = results.map((r: any) => ({
    ...r,
    selections: typeof r.selections === "string" ? JSON.parse(r.selections || "null") : r.selections,
  }));
  return c.json({ data });
});

app.post("/leads", async (c) => {
  const lead = await c.req.json();
  if (!lead?.id) return c.json({ error: "Missing id" }, 400);
  await c.env.DB.prepare(
    `INSERT INTO leads (id, name, phone, message, source, timestamp, status, notes, selections)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
     ON CONFLICT(id) DO UPDATE SET
       name=excluded.name, phone=excluded.phone, message=excluded.message,
       source=excluded.source, status=excluded.status, notes=excluded.notes,
       selections=excluded.selections`,
  ).bind(
    lead.id, lead.name ?? "", lead.phone ?? "", lead.message ?? "",
    lead.source ?? "", lead.timestamp ?? new Date().toISOString(),
    lead.status ?? "new", lead.notes ?? null,
    lead.selections ? JSON.stringify(lead.selections) : null,
  ).run();
  return c.json({ ok: true });
});

app.patch("/leads/:id/status", async (c) => {
  const { status } = await c.req.json();
  await c.env.DB.prepare("UPDATE leads SET status = ? WHERE id = ?")
    .bind(status, c.req.param("id")).run();
  return c.json({ ok: true });
});

app.patch("/leads/:id/notes", async (c) => {
  const { notes } = await c.req.json();
  await c.env.DB.prepare("UPDATE leads SET notes = ? WHERE id = ?")
    .bind(notes, c.req.param("id")).run();
  return c.json({ ok: true });
});

app.delete("/leads/:id", async (c) => {
  await c.env.DB.prepare("DELETE FROM leads WHERE id = ?")
    .bind(c.req.param("id")).run();
  return c.json({ ok: true });
});

// ─── Orders ──────────────────────────────────────────────────────────────────

app.get("/orders", async (c) => {
  const { results } = await c.env.DB.prepare(
    "SELECT * FROM orders ORDER BY timestamp DESC",
  ).all();
  const data = results.map((r: any) => ({
    ...r,
    customer: typeof r.customer === "string" ? JSON.parse(r.customer || "{}") : r.customer,
    items: typeof r.items === "string" ? JSON.parse(r.items || "[]") : r.items,
  }));
  return c.json({ data });
});

app.post("/orders", async (c) => {
  const order = await c.req.json();
  if (!order?.id) return c.json({ error: "Missing id" }, 400);
  await c.env.DB.prepare(
    `INSERT INTO orders (id, customer, items, total, timestamp, status)
     VALUES (?, ?, ?, ?, ?, ?)
     ON CONFLICT(id) DO UPDATE SET
       customer=excluded.customer, items=excluded.items, total=excluded.total,
       status=excluded.status`,
  ).bind(
    order.id,
    JSON.stringify(order.customer ?? {}),
    JSON.stringify(order.items ?? []),
    order.total ?? 0,
    order.timestamp ?? new Date().toISOString(),
    order.status ?? "new",
  ).run();
  return c.json({ ok: true });
});

app.patch("/orders/:id/status", async (c) => {
  const { status } = await c.req.json();
  await c.env.DB.prepare("UPDATE orders SET status = ? WHERE id = ?")
    .bind(status, c.req.param("id")).run();
  return c.json({ ok: true });
});

app.delete("/orders/:id", async (c) => {
  await c.env.DB.prepare("DELETE FROM orders WHERE id = ?")
    .bind(c.req.param("id")).run();
  return c.json({ ok: true });
});

// ─── Blog posts ───────────────────────────────────────────────────────────────

app.get("/blog-posts", async (c) => {
  const { results } = await c.env.DB.prepare(
    "SELECT * FROM blog_posts ORDER BY published_at DESC",
  ).all();
  return c.json({ data: results });
});

app.post("/blog-posts", async (c) => {
  const p = await c.req.json();
  if (!p?.id) return c.json({ error: "Missing id" }, 400);
  await c.env.DB.prepare(
    `INSERT INTO blog_posts
       (id, slug, title, title_ru, description, description_ru, content, content_ru,
        image_url, category, category_ru, published_at, updated_at, author,
        meta_title, meta_title_ru, meta_description, meta_description_ru,
        keywords, keywords_ru, published, reading_time)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
     ON CONFLICT(id) DO UPDATE SET
       slug=excluded.slug, title=excluded.title, title_ru=excluded.title_ru,
       description=excluded.description, description_ru=excluded.description_ru,
       content=excluded.content, content_ru=excluded.content_ru,
       image_url=excluded.image_url, category=excluded.category, category_ru=excluded.category_ru,
       published_at=excluded.published_at, updated_at=excluded.updated_at, author=excluded.author,
       meta_title=excluded.meta_title, meta_title_ru=excluded.meta_title_ru,
       meta_description=excluded.meta_description, meta_description_ru=excluded.meta_description_ru,
       keywords=excluded.keywords, keywords_ru=excluded.keywords_ru,
       published=excluded.published, reading_time=excluded.reading_time`,
  ).bind(
    p.id, p.slug ?? "", p.title ?? "", p.title_ru ?? null,
    p.description ?? "", p.description_ru ?? null,
    p.content ?? "", p.content_ru ?? null,
    p.image_url ?? null, p.category ?? null, p.category_ru ?? null,
    p.published_at ?? new Date().toISOString(),
    p.updated_at ?? new Date().toISOString(), p.author ?? null,
    p.meta_title ?? null, p.meta_title_ru ?? null,
    p.meta_description ?? null, p.meta_description_ru ?? null,
    p.keywords ?? null, p.keywords_ru ?? null,
    p.published === false ? 0 : 1,
    p.reading_time ?? null,
  ).run();
  return c.json({ ok: true });
});

app.delete("/blog-posts/:id", async (c) => {
  await c.env.DB.prepare("DELETE FROM blog_posts WHERE id = ?")
    .bind(c.req.param("id")).run();
  return c.json({ ok: true });
});

// ─── Sessions ────────────────────────────────────────────────────────────────

app.post("/sessions", async (c) => {
  const s = await c.req.json();
  if (!s?.session_id && !s?.sessionId) return c.json({ ok: true });
  const sid = s.session_id ?? s.sessionId;
  const today = chisinauDate();
  await c.env.DB.prepare(
    `INSERT INTO sessions (session_id, date, referrer, utm_source, utm_medium, country, device_type, pages, is_lead, lead_type)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
     ON CONFLICT(session_id) DO UPDATE SET
       pages=excluded.pages, is_lead=excluded.is_lead, lead_type=excluded.lead_type`,
  ).bind(
    sid, today, s.referrer ?? null, s.utm_source ?? s.utmSource ?? null,
    s.utm_medium ?? s.utmMedium ?? null, s.country ?? null, s.device_type ?? s.deviceType ?? null,
    JSON.stringify(s.pages ?? []),
    s.is_lead ?? s.isLead ? 1 : 0, s.lead_type ?? s.leadType ?? null,
  ).run();
  return c.json({ ok: true });
});

// ─── Sales ───────────────────────────────────────────────────────────────────

app.post("/sales", async (c) => {
  const s = await c.req.json();
  const today = chisinauDate();
  await c.env.DB.prepare(
    "INSERT INTO sales (date, amount_mdl, description, session_id) VALUES (?, ?, ?, ?)",
  ).bind(today, s.amount_mdl ?? 0, s.description ?? "", s.session_id ?? null).run();
  return c.json({ ok: true });
});

// ─── Stats ───────────────────────────────────────────────────────────────────

app.get("/stats/:date", async (c) => {
  const date = c.req.param("date");
  const [visitors, leads, sales] = await Promise.all([
    c.env.DB.prepare("SELECT COUNT(*) as cnt FROM sessions WHERE date = ?").bind(date).first<{ cnt: number }>(),
    c.env.DB.prepare("SELECT COUNT(*) as cnt FROM sessions WHERE date = ? AND is_lead = 1").bind(date).first<{ cnt: number }>(),
    c.env.DB.prepare("SELECT COUNT(*) as cnt, SUM(amount_mdl) as total FROM sales WHERE date = ?").bind(date).first<{ cnt: number; total: number }>(),
  ]);
  return c.json({
    visitors: visitors?.cnt ?? 0,
    leads: leads?.cnt ?? 0,
    sales: sales?.cnt ?? 0,
    salesTotalMdl: sales?.total ?? 0,
  });
});

// ─── Notify: visitor ─────────────────────────────────────────────────────────

app.post("/notify/visitor", async (c) => {
  if (!c.env.TELEGRAM_BOT_TOKEN) return c.json({ ok: true, skipped: "not configured" });
  const session: SessionInfo = (await c.req.json().catch(() => ({}))).session ?? {};
  const sessionId = session.sessionId;
  const ip = c.req.header("CF-Connecting-IP") || c.req.header("X-Forwarded-For")?.split(",")[0]?.trim() || "unknown";
  const today = chisinauDate();

  if (sessionId && notifiedSessions.has(sessionId)) {
    return c.json({ ok: true, skipped: "already notified" });
  }

  const allowed = await checkRateLimit(c.env.DB, ip, today, "visitor", VISITOR_IP_DAILY_LIMIT);
  if (!allowed) return c.json({ ok: false, skipped: "rate limited" }, 429);

  if (sessionId) notifiedSessions.add(sessionId);
  if (notifiedSessions.size > 10000) notifiedSessions.clear();

  await notifyVisitor(c.env, session);
  return c.json({ ok: true });
});

// ─── Notify: first-message ────────────────────────────────────────────────────

app.post("/notify/first-message", async (c) => {
  if (!c.env.TELEGRAM_BOT_TOKEN) return c.json({ ok: true, skipped: "not configured" });
  const body = await c.req.json().catch(() => ({}));
  const session: SessionInfo = body.session ?? {};
  const sessionId = session.sessionId;

  const count = chatNotifyCounts.get(sessionId ?? "") ?? 0;
  if (count >= CHAT_NOTIFY_LIMIT) return c.json({ ok: true, skipped: "limit reached" });
  chatNotifyCounts.set(sessionId ?? "", count + 1);

  await notifyFirstMessage(c.env, {
    message: body.message ?? "", page: body.page ?? "/", session,
  });
  return c.json({ ok: true });
});

// ─── Notify: lead-chat ────────────────────────────────────────────────────────

app.post("/notify/lead-chat", async (c) => {
  if (!c.env.TELEGRAM_BOT_TOKEN) return c.json({ ok: true, skipped: "not configured" });
  const body = await c.req.json().catch(() => ({}));
  const phone: string = body.phone ?? "";
  const today = chisinauDate();
  const normalized = phone.replace(/\D/g, "");

  if (normalized) {
    const allowed = await checkRateLimit(c.env.DB, normalized, today, "lead-notify", LEAD_PHONE_DAILY_LIMIT);
    if (!allowed) return c.json({ ok: true, skipped: "phone already notified today" });
  }

  await notifyLeadChat(c.env, {
    name: body.name ?? "", phone,
    messages: body.messages ?? [], session: body.session ?? {},
  });
  return c.json({ ok: true });
});

// ─── Notify: lead-calculator ──────────────────────────────────────────────────

app.post("/notify/lead-calculator", async (c) => {
  if (!c.env.TELEGRAM_BOT_TOKEN) return c.json({ ok: true, skipped: "not configured" });
  const body = await c.req.json().catch(() => ({}));
  const phone: string = body.phone ?? "";
  const today = chisinauDate();
  const normalized = phone.replace(/\D/g, "");

  if (normalized) {
    const allowed = await checkRateLimit(c.env.DB, normalized, today, "lead-notify", LEAD_PHONE_DAILY_LIMIT);
    if (!allowed) return c.json({ ok: true, skipped: "phone already notified today" });
  }

  await notifyLeadCalculator(c.env, {
    name: body.name ?? "", phone,
    selections: body.selections ?? {},
    equipmentCost: body.equipmentCost ?? 0,
    installCost: body.installCost ?? 0,
    totalCost: body.totalCost ?? 0,
    session: body.session ?? {},
  });
  return c.json({ ok: true });
});

// ─── Notify: chat-notify (alias pentru first-message) ────────────────────────

app.post("/notify/chat-notify", async (c) => {
  if (!c.env.TELEGRAM_BOT_TOKEN) return c.json({ ok: true, skipped: "not configured" });
  const body = await c.req.json().catch(() => ({}));
  const session: SessionInfo = body.session ?? {};
  const sessionId = session.sessionId;

  const count = chatNotifyCounts.get(sessionId ?? "") ?? 0;
  if (count >= CHAT_NOTIFY_LIMIT) return c.json({ ok: true, skipped: "limit reached" });
  chatNotifyCounts.set(sessionId ?? "", count + 1);
  if (chatNotifyCounts.size > 10000) chatNotifyCounts.clear();

  await notifyFirstMessage(c.env, {
    message: body.message ?? "", page: body.page ?? "/", session,
  });
  return c.json({ ok: true });
});

// ─── Notify: chat-lead (alias pentru lead-chat) ───────────────────────────────

app.post("/notify/chat-lead", async (c) => {
  if (!c.env.TELEGRAM_BOT_TOKEN) return c.json({ ok: true, skipped: "not configured" });
  const body = await c.req.json().catch(() => ({}));
  const phone: string = body.phone ?? "";
  const today = chisinauDate();
  const normalized = phone.replace(/\D/g, "");

  if (normalized) {
    const allowed = await checkRateLimit(c.env.DB, normalized, today, "lead-notify", LEAD_PHONE_DAILY_LIMIT);
    if (!allowed) return c.json({ ok: true, skipped: "phone already notified today" });
  }

  await notifyLeadChat(c.env, {
    name: body.name ?? "", phone,
    messages: body.messages ?? [], session: body.session ?? {},
  });
  return c.json({ ok: true });
});

// ─── Notify: calculator (alias pentru lead-calculator) ────────────────────────

app.post("/notify/calculator", async (c) => {
  if (!c.env.TELEGRAM_BOT_TOKEN) return c.json({ ok: true, skipped: "not configured" });
  const body = await c.req.json().catch(() => ({}));
  const phone: string = body.phone ?? "";
  const today = chisinauDate();
  const normalized = phone.replace(/\D/g, "");

  if (normalized) {
    const allowed = await checkRateLimit(c.env.DB, normalized, today, "lead-notify", LEAD_PHONE_DAILY_LIMIT);
    if (!allowed) return c.json({ ok: true, skipped: "phone already notified today" });
  }

  await notifyLeadCalculator(c.env, {
    name: body.name ?? "", phone,
    selections: body.selections ?? {},
    equipmentCost: body.equipmentCost ?? 0,
    installCost: body.installCost ?? 0,
    totalCost: body.totalCost ?? 0,
    session: body.session ?? {},
  });
  return c.json({ ok: true });
});

// ─── Notify: lead (apel simplu post-addLead) ──────────────────────────────────

app.post("/notify/lead", async (c) => {
  if (!c.env.TELEGRAM_BOT_TOKEN) return c.json({ ok: true, skipped: "not configured" });
  const body = await c.req.json().catch(() => ({}));
  const { name = "", phone = "", source = "", notes = "", session = {} as SessionInfo } = body;
  const today = chisinauDate();
  const normalized = (phone as string).replace(/\D/g, "");

  if (normalized) {
    const allowed = await checkRateLimit(c.env.DB, normalized, today, "lead-notify", LEAD_PHONE_DAILY_LIMIT);
    if (!allowed) return c.json({ ok: true, skipped: "phone already notified today" });
  }

  const loc = [session.city, session.country].filter(Boolean).join(", ");
  const src = formatSource(session.referrer || "", session.utmSource || "", session.utmMedium || "");
  const lines = [
    `🎯 <b>Lead Nou — ${esc(source || "Site")}</b>`,
    ``,
    `👤 <b>${esc(name || "Anonim")}</b>  |  📞 <code>${esc(phone)}</code>`,
    loc ? `📍 ${esc(loc)}` : "",
    `🌐 Sursă: ${esc(src)}`,
    notes ? `📝 ${esc(notes)}` : "",
  ].filter(Boolean).join("\n");

  await sendTelegram(c.env, lines);
  return c.json({ ok: true });
});

// ─── Notify: order (comandă nouă din checkout) ────────────────────────────────

app.post("/notify/order", async (c) => {
  if (!c.env.TELEGRAM_BOT_TOKEN) return c.json({ ok: true, skipped: "not configured" });
  const body = await c.req.json().catch(() => ({}));
  const {
    orderId = "", name = "", phone = "", address = "", delivery = "",
    items = [], subtotal = 0, shippingCost = 0, total = 0,
    session = {} as SessionInfo,
  } = body;

  const itemsText = (items as any[])
    .slice(0, 10)
    .map((i: any) => `  • ${esc(i.name)} × ${i.qty} — ${(i.price * i.qty).toLocaleString("ro-MD")} MDL`)
    .join("\n");

  const lines = [
    `🛒 <b>Comandă Nouă #${esc(orderId)}</b>`,
    ``,
    `👤 <b>${esc(name)}</b>  |  📞 <code>${esc(phone)}</code>`,
    `📍 ${esc(address || "—")}  |  🚚 ${esc(delivery || "—")}`,
    ``,
    `📦 <b>Produse:</b>`,
    itemsText,
    ``,
    `💰 Subtotal: ${Number(subtotal).toLocaleString("ro-MD")} MDL`,
    shippingCost > 0 ? `🚚 Livrare: ${Number(shippingCost).toLocaleString("ro-MD")} MDL` : "",
    `💳 <b>Total: ${Number(total).toLocaleString("ro-MD")} MDL</b>`,
    session.country ? `🌍 ${esc([session.city, session.country].filter(Boolean).join(", "))}` : "",
  ].filter(Boolean).join("\n");

  await sendTelegram(c.env, lines);
  return c.json({ ok: true });
});

// ─── Notify: daily-report (admin) ─────────────────────────────────────────────

app.post("/notify/daily-report", async (c) => {
  const pin = c.req.header("x-admin-pin");
  if (!pin || pin !== c.env.SESSION_SECRET) {
    return c.json({ ok: false, error: "Unauthorized" }, 401);
  }
  if (!c.env.TELEGRAM_BOT_TOKEN || !c.env.TELEGRAM_CHAT_ID) {
    return c.json({ ok: false, error: "Telegram not configured" });
  }

  const today = chisinauDate(0);
  const yesterday = chisinauDate(-1);

  const getStats = async (date: string) => {
    const [v, l] = await Promise.all([
      c.env.DB.prepare("SELECT COUNT(*) as cnt FROM sessions WHERE date = ?").bind(date).first<{ cnt: number }>(),
      c.env.DB.prepare("SELECT COUNT(*) as cnt FROM sessions WHERE date = ? AND is_lead = 1").bind(date).first<{ cnt: number }>(),
    ]);
    return { visitors: v?.cnt ?? 0, leads: l?.cnt ?? 0 };
  };

  const [todayStats, yesterdayStats] = await Promise.all([getStats(today), getStats(yesterday)]);

  if (todayStats.visitors === 0) {
    return c.json({ ok: true, skipped: "no visitors today" });
  }

  const pct = (now: number, prev: number) => {
    if (prev === 0) return now > 0 ? " (nou 🆕)" : "";
    const diff = Math.round(((now - prev) / prev) * 100);
    return diff === 0 ? " (=)" : diff > 0 ? ` (+${diff}%)` : ` (${diff}%)`;
  };

  const dateLabel = new Intl.DateTimeFormat("ro-MD", {
    weekday: "long", day: "numeric", month: "long",
  }).format(new Date(today));

  const lines = [
    `📊 <b>Raport Zilnic Teco.md</b>`,
    `<i>${esc(dateLabel)}</i>`,
    ``,
    `👥 <b>Vizitatori unici:</b> ${todayStats.visitors}${pct(todayStats.visitors, yesterdayStats.visitors)}`,
    `🎯 <b>Leaduri noi:</b> ${todayStats.leads}${pct(todayStats.leads, yesterdayStats.leads)}`,
  ].join("\n");

  await sendTelegram(c.env, lines);
  return c.json({ ok: true, date: today, ...todayStats });
});

// ─── Export ──────────────────────────────────────────────────────────────────

export const onRequest = handle(app);
