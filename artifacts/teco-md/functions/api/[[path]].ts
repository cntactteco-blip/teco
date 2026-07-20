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
  GROQ_API_KEY?: string;
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

// Generează flag emoji din cod ISO-2 (MD→🇲🇩) sau din nume de țară
const COUNTRY_NAME: Record<string, string> = {
  MD: "Moldova", RO: "România", DE: "Germania", IT: "Italia",
  FR: "Franța", GB: "Marea Britanie", US: "SUA", UA: "Ucraina",
  RU: "Rusia", IL: "Israel", ES: "Spania", PT: "Portugalia",
  NL: "Olanda", BE: "Belgia", AT: "Austria", CH: "Elveția",
  CA: "Canada", AU: "Australia", PL: "Polonia", CZ: "Cehia",
  SK: "Slovacia", HU: "Ungaria", BG: "Bulgaria", GR: "Grecia",
  TR: "Turcia", AE: "Emirates", GB: "UK",
};

function flagFromCode(code: string): string {
  if (!code || code.length !== 2) return "🌍";
  return String.fromCodePoint(
    ...code.toUpperCase().split("").map((c) => 0x1f1e6 + c.charCodeAt(0) - 65),
  );
}

function flag(countryOrCode: string): string {
  if (!countryOrCode) return "🌍";
  // Dacă e cod ISO-2 (ex: "MD")
  if (countryOrCode.length === 2) return flagFromCode(countryOrCode);
  // Dacă e nume de țară, găsim codul
  const code = Object.entries(COUNTRY_NAME).find(([, n]) => n === countryOrCode)?.[0];
  if (code) return flagFromCode(code);
  return "🌍";
}

function countryDisplay(countryOrCode: string): string {
  if (!countryOrCode) return "";
  if (countryOrCode.length === 2) return COUNTRY_NAME[countryOrCode.toUpperCase()] || countryOrCode;
  return countryOrCode;
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

// ─── Cloudflare geo (mai fiabil decât ip-api.com din browser) ───────────────

interface CfGeo { country: string; city: string; isp: string; countryName: string; }

function cfGeo(req: Request): CfGeo {
  const cf = (req as any).cf ?? {};
  const code: string = cf.country ?? "";
  const city: string = cf.city ?? "";
  const isp: string = cf.asOrganization ?? "";
  return { country: code, city, isp, countryName: countryDisplay(code) };
}

/** Îmbogățește sesiunea cu geo din CF (suprascrie câmpurile goale din client) */
function mergeGeo(session: SessionInfo, geo: CfGeo): SessionInfo {
  return {
    ...session,
    country: geo.countryName || session.country || "",
    city: geo.city || session.city || "",
    isp: geo.isp || session.isp || "",
  };
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
  const body = await c.req.json().catch(() => ({}));
  // CF geo suprascrie locația din browser (ip-api.com adesea blocat/rate-limited)
  const session: SessionInfo = mergeGeo(body.session ?? {}, cfGeo(c.req.raw));
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
  const session: SessionInfo = mergeGeo(body.session ?? {}, cfGeo(c.req.raw));
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
    messages: body.messages ?? [],
    session: mergeGeo(body.session ?? {}, cfGeo(c.req.raw)),
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
    session: mergeGeo(body.session ?? {}, cfGeo(c.req.raw)),
  });
  return c.json({ ok: true });
});

// ─── Notify: chat-notify (alias pentru first-message) ────────────────────────

app.post("/notify/chat-notify", async (c) => {
  if (!c.env.TELEGRAM_BOT_TOKEN) return c.json({ ok: true, skipped: "not configured" });
  const body = await c.req.json().catch(() => ({}));
  const session: SessionInfo = mergeGeo(body.session ?? {}, cfGeo(c.req.raw));
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
    messages: body.messages ?? [],
    session: mergeGeo(body.session ?? {}, cfGeo(c.req.raw)),
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
    session: mergeGeo(body.session ?? {}, cfGeo(c.req.raw)),
  });
  return c.json({ ok: true });
});

// ─── Notify: lead (apel simplu post-addLead) ──────────────────────────────────

app.post("/notify/lead", async (c) => {
  if (!c.env.TELEGRAM_BOT_TOKEN) return c.json({ ok: true, skipped: "not configured" });
  const body = await c.req.json().catch(() => ({}));
  const { name = "", phone = "", source = "", notes = "" } = body;
  const session: SessionInfo = mergeGeo(body.session ?? {}, cfGeo(c.req.raw));
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
    loc ? `${flag(session.country || "")} ${esc(loc)}` : "",
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
  } = body;
  const session: SessionInfo = mergeGeo(body.session ?? {}, cfGeo(c.req.raw));

  const itemsText = (items as any[])
    .slice(0, 10)
    .map((i: any) => `  • ${esc(i.name)} × ${i.qty} — ${(i.price * i.qty).toLocaleString("ro-MD")} MDL`)
    .join("\n");

  const loc = [session.city, session.country].filter(Boolean).join(", ");
  const lines = [
    `🛒 <b>Comandă Nouă #${esc(orderId)}</b>`,
    ``,
    `👤 <b>${esc(name)}</b>  |  📞 <code>${esc(phone)}</code>`,
    `📍 ${esc(address || "—")}  |  🚚 ${esc(delivery || "—")}`,
    loc ? `${flag(session.country || "")} ${esc(loc)}` : "",
    ``,
    `📦 <b>Produse:</b>`,
    itemsText,
    ``,
    `💰 Subtotal: ${Number(subtotal).toLocaleString("ro-MD")} MDL`,
    shippingCost > 0 ? `🚚 Livrare: ${Number(shippingCost).toLocaleString("ro-MD")} MDL` : "",
    `💳 <b>Total: ${Number(total).toLocaleString("ro-MD")} MDL</b>`,
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

// ═══════════════════════════════════════════════════════════════════════════════
// ─── AI — Groq helpers ────────────────────────────────────────────────────────
// ═══════════════════════════════════════════════════════════════════════════════

const GROQ_API = "https://api.groq.com/openai/v1/chat/completions";
const GROQ_MODEL = "llama-3.3-70b-versatile";

type GMsg = { role: "system" | "user" | "assistant"; content: string };

async function groqJSON(apiKey: string, messages: GMsg[], maxTokens = 1024): Promise<string> {
  const resp = await fetch(GROQ_API, {
    method: "POST",
    headers: { "Authorization": `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({ model: GROQ_MODEL, messages, max_tokens: maxTokens, stream: false }),
  });
  const data = await resp.json() as any;
  return data?.choices?.[0]?.message?.content ?? "";
}

// ─── Catalog builder (identic cu api-server) ─────────────────────────────────

const CAT_LABELS: Record<string, string> = {
  wifi: "CAMERE WiFi", poe: "CAMERE PoE (Cablate)",
  "4g": "CAMERE 4G/Solar (fără WiFi, fără curent)",
  nvr: "NVR-uri (Înregistratoare)",
  kituri: "Kituri Complete (cameră+NVR+HDD, gata de instalat)",
  alarme: "Sisteme Alarmă",
};

interface PEntry { id: number; name: string; brand: string; price: number; oldPrice?: number | null; specs: string; category: string; badge?: string | null; inStock?: boolean; }

function buildCatalog(products: PEntry[]): string {
  if (!products?.length) return "(catalog indisponibil)";
  const groups: Record<string, PEntry[]> = {};
  for (const p of products) (groups[p.category] ??= []).push(p);
  const order = ["wifi", "poe", "4g", "nvr", "kituri", "alarme"];
  const sorted = [...order.filter(k => groups[k]), ...Object.keys(groups).filter(k => !order.includes(k))];
  return sorted.map(cat => {
    const label = CAT_LABELS[cat] ?? cat.toUpperCase();
    const lines = groups[cat].map(p => {
      const stock = p.inStock === false ? " [LIPSĂ STOC]" : "";
      const promo = p.oldPrice ? ` (era ${p.oldPrice} MDL)` : "";
      const badge = p.badge ? ` [${p.badge}]` : "";
      return `[${p.id}] ${p.brand} ${p.name}${badge}${stock} — ${p.specs} — ${p.price} MDL${promo}`;
    });
    return `=== ${label} ===\n${lines.join("\n")}`;
  }).join("\n\n");
}

interface StoreSettings {
  phone?: string;
  workingHours?: string;
  city?: string;
  address?: string;
  deliveryPrice?: number;
  deliveryFreeAt?: number;
  montaj?: string;
  diagnosticare?: string;
}

function buildTecoBotPrompt(catalog: string, s: StoreSettings, lang?: string): string {
  const phone    = s.phone            || "+373 67 200 463";
  const hours    = s.workingHours     || "Lun–Sâm 09:00–19:00";
  const city     = s.city             || "Chișinău, Moldova";
  const address  = s.address          ? `\n- Adresă: ${s.address}` : "";
  const delivery = s.deliveryPrice    ? `${s.deliveryPrice} MDL` : "~150 MDL";
  const freeAt   = s.deliveryFreeAt   ? `${s.deliveryFreeAt} MDL` : "5000 MDL";
  const montaj   = s.montaj           || "de la 750 MDL/cameră";
  const diagn    = s.diagnosticare    || "de la 350 MDL/vizită";

  let prompt = `Ești TecoBot — consultant de vânzări la Teco.md, magazin de sisteme de supraveghere din ${city}. Cunoști fiecare produs, fiecare situație, știi exact cum gândește clientul din Moldova.

════════════════════════════════════════════
REGULA #1 — CARDURI INTERACTIVE (CITEȘTE PRIMUL)
════════════════════════════════════════════

Catalogul de mai jos listează produsele cu format: [ID] Brand Nume — specs — preț MDL
Când recomanzi orice produs, TREBUIE să incluzi [ID] în răspuns — exact ca în catalog.

EXEMPLE CORECTE (urmează exact acest format):
→ "Setul DAHUA Kit 4 Camere [12] la 6800 MDL e fix ce îți trebuie pentru curte."
→ "Ai două opțiuni: UNIVIEW Set 4MP [23] la 12795 MDL cu instalare, sau DAHUA Kit PoE [8] la 8500 MDL."
→ "Cel mai popular la case e setul ăsta — DAHUA ColorNoaptea [15] la 7200 MDL, include și NVR-ul."

EXEMPLE GREȘITE (nu face asta niciodată):
✗ "Avem un set DAHUA ColorNoaptea la 6800 MDL." — lipsește [id], nu apare cardul!
✗ "Setul de 4 camere costă 6800 MDL." — fără [id], fără card!

Fiecare produs menționat = [id] obligatoriu. Fără excepție.

════════════════════════════════════════════
REGULA #2 — CÂND RECOMANZI IMEDIAT vs CÂND ÎNTREBI
════════════════════════════════════════════

RECOMANDĂ IMEDIAT (fără întrebări suplimentare) când clientul a dat deja:
✓ Numărul de camere (ex: "4 camere", "un set de 6") → suficient, recomandă direct
✓ Locația (ex: "curtea", "interior", "magazin", "depozit") → suficient, recomandă direct
✓ Număr + locație → recomandă IMEDIAT, fără altă întrebare
✓ Bugetul (ex: "am 5000 MDL") → recomandă direct ce se potrivește
✓ "Ce aveți?", "Arătați-mi", "Ce recomandați?" → recomandă direct 2 produse bune

ÎNTREABĂ O SINGURĂ ÎNTREBARE doar dacă nu știi nici numărul nici locația:
- Vag total ("vreau camere", "am nevoie de supraveghere") → întreabă: "Pentru casă sau firmă?"
- După răspuns → recomandă direct, NU mai pune altă întrebare

NICIODATĂ nu pune 2 întrebări înainte de a recomanda un produs. Clientul a venit să cumpere, nu să fie interogat.

════════════════════════════════════════════
DATE LIVE TECO.MD
════════════════════════════════════════════

- Telefon / WhatsApp: ${phone}
- Program: ${hours}
- Locație: ${city}${address}
- 847+ instalări în toată Moldova | Rating 4.9/5
- Garanție 2–3 ani produse + garanție pe manoperă
- Instalare 24h oriunde în Moldova | ${montaj}
- Livrare curier: ${delivery} (gratuită peste ${freeAt})
- Rate prin parteneri financiari | Retur 14 zile produs neinstalat

════════════════════════════════════════════
FILOZOFIA DE VÂNZARE
════════════════════════════════════════════

Tu nu vinzi camere. Tu vinzi liniște, control, siguranță. Clientul vine pentru că i s-a furat, are copii acasă, are afacere sau a văzut la vecin. Sarcina ta: înțelege rapid situația și dai soluția concretă. Consultantul bun nu interogheaza — ghidează.

Regula de aur: când clientul dă informație, acționezi. Nu mai întrebi.

ETAPE (rapide):
1. Dacă știi nevoia → recomandă imediat cu [id]
2. Dacă nu știi → o singură întrebare → recomandă imediat cu [id]
3. Obiecție → recunoaște, întoarce, oferă alternativă
4. Interes real → cere contact natural, ghidează spre pasul următor

Întrebări de implicație (folosești când clientul e nesigur, nu la început):
- "Dacă s-ar întâmpla ceva azi-noapte, cum ai dovedi?"
- "Sistemul pe care îl ai înregistrează sau doar arată live?"

════════════════════════════════════════════
PSIHOLOGIA CLIENTULUI MOLDOVEAN
════════════════════════════════════════════

Clientul moldovean e inteligent, sceptic și a fost vândut rău de prea multe ori. Nu i se poate vinde cu presiune — asta îl închide instant.

Ce funcționează:
✓ SPECIFICITATE — "847 de instalări" bate "experiență vastă" de 10 ori
✓ DOVADĂ SOCIALĂ — "Am instalat la un client din Florești exact același sistem, e mulțumit de 2 ani" convinge mai mult decât orice specificație
✓ ONESTITATE DEZARMANTĂ — dacă un produs nu i se potrivește, spune-i. Încrederea câștigată valorează mai mult decât o vânzare forțată
✓ RECIPROCITATE — dă sfat util gratuit înainte să ceri ceva. Omul simte că îi ești dator cu o vânzare corectă
✓ PIERDERE > CÂȘTIG — "Fără camere nu poți dovedi nimic la poliție" convinge mai mult decât "Cu camere ești în siguranță"
✓ APROBARE SOCIALĂ — "Cei mai mulți clienți de la casă aleg exact setul ăsta" reduce incertitudinea
✓ SIMPLITATE — nu tehnic. Beneficiu uman: "arată color ca ziua", "vezi de pe telefon oriunde ești"

Ce NU funcționează:
✗ Presiune ("oferta expiră azi") — Moldoveanul o detectează instant și pleacă
✗ Prea mult entuziasm — sună fals
✗ Termeni tehnici fără explicație — pierde clientul
✗ Răspunsuri lungi — citește pe telefon în mers
✗ Fraze românești — "bineînțeles", "cu siguranță", "vă mulțumesc frumos"

════════════════════════════════════════════
CUNOȘTINȚE TEHNICE (pentru când sunt necesare)
════════════════════════════════════════════

TIPURI CAMERE:
- WiFi: fără cablu de date, doar priză. Interior, apartament, birou mic. Limitare: depinde de WiFi.
- PoE: cablu unic date+curent. Stabile, nu depind de WiFi. Exterior, curte, depozit.
- 4G/Solar: fără WiFi și fără curent. SIM card ~50–100 MDL/lună. Câmp, șantier, lot izolat.
- Analog/DVR: sisteme vechi coaxial. Doar dacă clientul are deja DVR și adaugă camere.

REZOLUȚIE:
- 2MP Full HD: față și numere mașini la 5–8m. Standard.
- 4MP 2K: mai detaliat, exterior, zone largi.
- 8MP 4K: maxim detaliu, intrări critice, corporații.
- ColorNoaptea: imagine COLOR noaptea (nu alb-negru). Are nevoie de puțină lumină ambiantă. Extrem popular.
- IR: alb-negru noaptea, funcționează în întuneric total, 20–60m.

NVR/HDD:
- NVR cu PoE integrat: cel mai simplu — un singur dispozitiv.
- 1TB ≈ 7–10 zile la 4 camere HD. 2TB ≈ 14–20 zile.

BRANDURI:
- DAHUA: top mondial, calitate/preț excelent. Recomandăm fără ezitare.
- UNIVIEW: imagine excepțională, corporații și proiecte mari.
- Imou (sub-brand Dahua): plug & play, ideal acasă fără instalator.
- Branduri OLX/AliExpress: NU. Clienții care au cumpărat ieftin revin la noi după 6 luni.

APLICAȚII MOBILE:
- DAHUA → DMSS | UNIVIEW → EZView | Imou → Imou App
- Configurăm noi la instalare. Clientul nu trebuie să știe nimic tehnic.

RĂSPUNSURI LA ÎNTREBĂRI FRECVENTE:
- Instalarea cât costă? → ${montaj}. Tehnicianul vine gratuit să evalueze, preț fix după vizită.
- Fără internet merge? → Da. Înregistrare locală pe HDD, monitor sau telefon în rețea locală.
- Cât țin înregistrările? → 1TB ≈ 7-10 zile / 4 camere. Kituri noastre includ HDD.
- E legal? → Da, pe proprietatea ta. La locuri publice — panou de avertizare, te ajutăm noi.
- Garanție? → 2–3 ani produs + garanție manoperă. Venim noi, nu trimiți tu coletul.
- Mergeți în raion? → Da, toată Moldova. Cost deplasare minim sau inclus în ofertă.

════════════════════════════════════════════
GESTIONAREA OBIECȚIILOR — TACTICI EXACTE
════════════════════════════════════════════

"E scump / nu am bani" →
Niciodată nu te scuzi pentru preț. Întreabă: "Ce buget ai în minte?" → găsești varianta potrivită din catalog. Dacă bugetul e mic — există variante accesibile. Dacă nu există — spune sincer și explică diferența de calitate.
Sau: "Dacă o împarți la 3 ani de garanție, iese mai ieftin decât crezi pe lună."

"Am găsit mai ieftin pe OLX / la altul" →
"Poți găsi mai ieftin, sigur. Diferența e ce faci când ceva nu merge — la noi suni și venim. Pe OLX nu suni pe nimeni."
Nu ataci vânzătorul. Arăți ce oferi tu în plus.

"Mă mai gândesc" →
Nu insista. "Firesc, e o decizie. Ce anume mai vrei să clarifici?" — află obstacolul real.
Dacă nu există obstacol real: "Ok, dacă ai întrebări sunt aici. Poți și suna direct: ${phone}."

"Nu știu dacă am nevoie" →
Pune întrebarea de implicație: "Ai mai avut vreun incident pe la casă / firmă?" sau "Dacă s-ar întâmpla ceva, cum ai dovedi?"

"Prietenul a instalat singur și merge" →
"Bine că i-a ieșit. La sisteme simple se poate. La clădiri mai complexe, o greșeală de cablu costă mai mult decât instalatorul."

"Dați garanție?" →
"Da, 2–3 ani pe produse și garanție pe manoperă. Dacă ceva cade din vina instalării, revenim fără costuri."

════════════════════════════════════════════
TON ȘI LIMBĂ — PENTRU MOLDOVA
════════════════════════════════════════════

VORBEȘTI CA UN OM DIN MOLDOVA, nu ca un call center din România:
- Direct și cald. Fără formule pompoase.
- NU: "Bună ziua! Cu ce vă pot ajuta?", "Desigur!", "Cu plăcere!", "Înțeleg că doriți...", "Vă mulțumesc pentru întrebare"
- DA: continui firesc, ca o discuție reală la telefon sau WhatsApp
- Prețurile ÎNTOTDEAUNA în MDL. Nu "lei" în sens românesc.
- Locații moldovenești: Chișinău, Bălți, Orhei, Soroca — nu București, Cluj, Iași
- Răspunsuri SCURTE: 2–3 propoziții. La recomandare cu preț — maxim 4–5.
- UN singur lucru pe mesaj. O singură întrebare odată.
- "Salut" — DOAR la primul mesaj. Apoi continui direct.
- Variezi reacțiile. Nu "Perfect!" la fiecare răspuns. Uneori nu reacționezi, continui direct.
- Nu explici termeni tehnici dacă nu ți se cere. Explici beneficii.

════════════════════════════════════════════
CATALOG LIVE (actualizat automat din admin):
{CATALOG}

════════════════════════════════════════════
REGULA CARDURILOR INTERACTIVE — OBLIGATORIE
════════════════════════════════════════════

Când menționezi orice produs din catalog, scrie [id] imediat după nume — activează cardul cu imagine, preț și buton "În coș":
  ✓ "Kit-ul DAHUA ColorNoaptea [12] la 6800 MDL e exact ce îți trebuie pentru curte."
  ✓ "Ai două variante bune: UNIVIEW 4MP [23] la 12795 MDL cu instalare inclusă, sau DAHUA PoE [8] la 8500 MDL."
Maxim 2–3 produse odată. Prețul EXACT din catalog. NU inventa nimic.
Dacă nu ai varianta potrivită — spune sincer și trimite la ${phone}.

════════════════════════════════════════════
CAPTARE LEAD — CÂND ȘI CUM
════════════════════════════════════════════

Ceri contactul NUMAI când clientul arată interes real — vrea să cumpere, vrea instalare, vrea ofertă concretă. Nu la prima întrebare generală.
Natural și fără presiune: "Ca să îți pot face oferta exactă, am nevoie de un număr de telefon. Și cum te cheamă?"
Când primești NUMELE și TELEFONUL, răspunzi cald și normal, și adaugi pe ULTIMA linie, EXACT:
LEAD_CAPTURED:name=NUME,phone=TELEFON

════════════════════════════════════════════
LIMBĂ
════════════════════════════════════════════
Răspunzi ÎNTOTDEAUNA în limba clientului — română sau rusă. NICIODATĂ mixt în același mesaj.`;

  if (lang === "ru") prompt += `\n\nNOTĂ SISTEM: Clientul comunică în rusă. Răspunde în rusă. Prețurile rămân în MDL. Aceleași principii de vânzare — adaptează tonul la publicul rusofon din Moldova (direct, fără formalism excesiv, fără stilul agenților din Rusia).`;
  return prompt;
}

// ─── AI: chat streaming (SSE) ─────────────────────────────────────────────────

app.post("/ai/chat", async (c) => {
  const key = c.env.GROQ_API_KEY;
  if (!key) return c.json({ error: "GROQ_API_KEY not configured" }, 503);

  const body = await c.req.json().catch(() => ({}));
  const { messages = [], lang = "ro", products = [], storeSettings = {} } = body as {
    messages: { role: "user" | "assistant"; content: string }[];
    lang?: string;
    products?: PEntry[];
    storeSettings?: StoreSettings;
  };

  const catalog = buildCatalog(products);
  const systemPrompt = buildTecoBotPrompt(catalog, storeSettings, lang);

  const groqMessages: GMsg[] = [
    { role: "system", content: systemPrompt },
    ...messages.map(m => ({ role: m.role as "user" | "assistant", content: m.content })),
  ];

  // Stream via TransformStream — funcționează nativ în CF Workers
  const { readable, writable } = new TransformStream<Uint8Array, Uint8Array>();
  const writer = writable.getWriter();
  const enc = new TextEncoder();

  (async () => {
    try {
      const groqResp = await fetch(GROQ_API, {
        method: "POST",
        headers: { "Authorization": `Bearer ${key}`, "Content-Type": "application/json" },
        body: JSON.stringify({ model: GROQ_MODEL, messages: groqMessages, max_tokens: 1024, stream: true }),
      });

      if (!groqResp.body) throw new Error("no body");
      const reader = groqResp.body.getReader();
      const dec = new TextDecoder();
      let buf = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buf += dec.decode(value, { stream: true });
        const parts = buf.split("\n\n");
        buf = parts.pop() ?? "";
        for (const part of parts) {
          for (const line of part.split("\n")) {
            if (!line.startsWith("data: ")) continue;
            const raw = line.slice(6).trim();
            if (raw === "[DONE]") continue;
            try {
              const chunk = JSON.parse(raw);
              const text = chunk.choices?.[0]?.delta?.content ?? "";
              if (text) await writer.write(enc.encode(`data: ${JSON.stringify({ content: text })}\n\n`));
            } catch {}
          }
        }
      }
      await writer.write(enc.encode(`data: ${JSON.stringify({ done: true })}\n\n`));
    } catch (err) {
      await writer.write(enc.encode(`data: ${JSON.stringify({ error: String(err) })}\n\n`));
    } finally {
      await writer.close();
    }
  })();

  return new Response(readable, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      "X-Accel-Buffering": "no",
    },
  });
});

// ─── AI: lead-analyze ─────────────────────────────────────────────────────────

app.post("/ai/lead-analyze", async (c) => {
  const key = c.env.GROQ_API_KEY;
  if (!key) return c.json({ error: "GROQ_API_KEY not configured" }, 503);

  const { lead } = await c.req.json().catch(() => ({ lead: {} })) as {
    lead: { name: string; phone: string; message?: string; source?: string };
  };

  const prompt = `Analizează acest lead pentru magazinul Teco.md (sisteme supraveghere Moldova):
Nume: ${lead.name}
Telefon: ${lead.phone}
Mesaj: ${lead.message || "—"}
Sursă: ${lead.source || "—"}

Răspunde în română în format JSON strict (doar JSON, fără alte texte):
{
  "score": 1-10,
  "potential": "mic|mediu|mare",
  "estimatedBudget": "estimare în MDL",
  "recommendation": "ce să îi oferi",
  "whatsappMessage": "mesaj WhatsApp personalizat gata de trimis în română"
}`;

  try {
    const text = await groqJSON(key, [{ role: "user", content: prompt }], 1024);
    return c.json(JSON.parse(text.replace(/```json|```/g, "").trim()));
  } catch (err) {
    return c.json({ error: String(err) }, 500);
  }
});

// ─── AI: whatsapp-message ─────────────────────────────────────────────────────

app.post("/ai/whatsapp-message", async (c) => {
  const key = c.env.GROQ_API_KEY;
  if (!key) return c.json({ error: "GROQ_API_KEY not configured" }, 503);

  const { lead, context } = await c.req.json().catch(() => ({ lead: {}, context: "" })) as {
    lead: { name: string; phone: string; message?: string };
    context?: string;
  };

  const prompt = `Generează un mesaj WhatsApp profesional și prietenos pentru clientul:
Nume: ${lead.name}
Mesaj/Cerere: ${lead.message || "interesat de sisteme supraveghere"}
Context suplimentar: ${context || "—"}

Magazin: Teco.md — sisteme supraveghere, instalare profesională în Moldova
Telefon: +373 67 200 463

Mesajul trebuie să fie:
- Scurt (max 5 rânduri)
- Personalizat cu numele clientului
- În română
- Să includă o ofertă sau să ceară detalii
- Să se termine cu o întrebare pentru a continua dialogul

Returnează DOAR mesajul, fără explicații.`;

  try {
    const message = await groqJSON(key, [{ role: "user", content: prompt }], 512);
    return c.json({ message });
  } catch (err) {
    return c.json({ error: String(err) }, 500);
  }
});

// ─── AI: description ─────────────────────────────────────────────────────────

app.post("/ai/description", async (c) => {
  const key = c.env.GROQ_API_KEY;
  if (!key) return c.json({ error: "GROQ_API_KEY not configured" }, 503);

  const { name, specs, brand, price, category } = await c.req.json().catch(() => ({})) as {
    name: string; specs: string; brand: string; price: number; category: string;
  };

  const prompt = `Generează o descriere SEO optimizată pentru produs de la Teco.md:
Produs: ${name}
Brand: ${brand}
Specificații: ${specs}
Preț: ${price} MDL
Categorie: ${category}

Cerințe:
- 2-3 propoziții
- Menționează specificațiile cheie
- Orientat spre client moldovean
- Include cuvinte cheie SEO pentru Moldova
- În română
- Fără bullet points, text continuu

Returnează DOAR descrierea produsului.`;

  try {
    const description = await groqJSON(key, [{ role: "user", content: prompt }], 512);
    return c.json({ description });
  } catch (err) {
    return c.json({ error: String(err) }, 500);
  }
});

// ─── AI: business-insights ───────────────────────────────────────────────────

app.post("/ai/business-insights", async (c) => {
  const key = c.env.GROQ_API_KEY;
  if (!key) return c.json({ error: "GROQ_API_KEY not configured" }, 503);

  const { orders, leads, products } = await c.req.json().catch(() => ({})) as {
    orders: unknown[]; leads: unknown[]; products: unknown[];
  };

  const prompt = `Analizează datele de business ale magazinului Teco.md (sisteme supraveghere, Moldova):

Comenzi recente: ${JSON.stringify(orders?.slice(0, 20) ?? [])}
Lead-uri recente: ${JSON.stringify(leads?.slice(0, 20) ?? [])}
Produse (top după stoc): ${JSON.stringify(products?.slice(0, 15) ?? [])}

Oferă 3-5 recomandări acționabile în română în format JSON strict (doar JSON):
{
  "summary": "rezumat scurt al stării business-ului",
  "insights": [
    {"title": "...", "description": "...", "action": "ce să faci concret"}
  ],
  "topOpportunity": "cea mai mare oportunitate de creștere acum"
}`;

  try {
    const text = await groqJSON(key, [{ role: "user", content: prompt }], 2048);
    return c.json(JSON.parse(text.replace(/```json|```/g, "").trim()));
  } catch (err) {
    return c.json({ error: String(err) }, 500);
  }
});

// ─── AI: import-products ─────────────────────────────────────────────────────

app.post("/ai/import-products", async (c) => {
  const key = c.env.GROQ_API_KEY;
  if (!key) return c.json({ error: "GROQ_API_KEY not configured" }, 503);

  const { csvData, usdRate, markup, fileName } = await c.req.json().catch(() => ({})) as {
    csvData: string; usdRate?: string; markup?: string; fileName?: string;
  };

  const rate = parseFloat(usdRate ?? "17.8") || 17.8;
  const markupPct = parseFloat(markup ?? "0") || 0;

  const prompt = `Ești un expert în import de produse pentru un magazin online de sisteme de supraveghere din Moldova (Teco.md).

Analizează acest CSV/tabel de produse și extrage fiecare produs ca JSON.

REGULI CRITICE pentru prețuri (foarte important):
1. Dacă există coloane cu prețuri în MDL (ex: "lei", "MDL"), folosește-le DIRECT — NU converti din USD.
2. Coloana "la zi" sau "preț curent" sau cel mai mic preț MDL = câmpul "price" (prețul de vânzare).
3. Coloana "RRP" sau "preț recomandat" sau cel mai mare preț MDL = câmpul "oldPrice" (prețul barat/anterior).
4. Dacă există DOAR prețuri în USD, atunci: price = USD × ${rate.toFixed(2)} × ${(1 + markupPct / 100).toFixed(4)}. Rotunjește la număr întreg.
5. Nu calcula oldPrice din USD când există deja un preț MDL în coloane.
6. Dacă nu există oldPrice separat, lasă câmpul null.

REGULI pentru categorii — alege una din: "wifi", "poe", "4g", "nvr", "kituri", "alarme", "Camere IP"

Fișier: ${fileName ?? "import.xlsx"}
Rată USD→MDL: ${rate}

Date CSV:
${csvData}

Returnează STRICT un array JSON valid (fără text înainte/după, fără markdown), cu structura exactă:
[
  {
    "name": "nume complet produs",
    "model": "cod model",
    "brand": "brand",
    "price": 799,
    "oldPrice": 999,
    "category": "wifi",
    "specs": "specificații scurte",
    "description": "descriere 2-3 propoziții SEO în română pentru Moldova",
    "inStock": true
  }
]`;

  try {
    const text = await groqJSON(key, [{ role: "user", content: prompt }], 4096);
    const clean = text.replace(/```json|```/g, "").trim();
    const match = clean.match(/\[[\s\S]*\]/);
    return c.json(JSON.parse(match ? match[0] : clean));
  } catch (err) {
    return c.json({ error: String(err) }, 500);
  }
});

// ─── AI: blog-post ────────────────────────────────────────────────────────────

app.post("/ai/blog-post", async (c) => {
  const key = c.env.GROQ_API_KEY;
  if (!key) return c.json({ error: "GROQ_API_KEY not configured" }, 503);

  const { topic } = await c.req.json().catch(() => ({ topic: "" })) as { topic: string };

  const prompt = `Ești un expert SEO și content writer pentru Teco.md — magazin de sisteme de supraveghere din Moldova (camere, NVR, kituri, alarme Ajax).

Scrie un articol de blog complet și optimizat SEO despre: "${topic}"

Returnează STRICT JSON valid (fără markdown, fără \`\`\`), cu structura exactă:
{
  "title": "titlu atractiv în română (max 65 caractere)",
  "titleRu": "titlu în rusă",
  "slug": "slug-url-fara-diacritice-cu-liniute",
  "category": "Ghiduri",
  "categoryRu": "Руководства",
  "description": "meta description SEO română (150-160 caractere)",
  "descriptionRu": "meta description rusă",
  "metaTitle": "meta title română cu keyword (max 65 caractere)",
  "metaTitleRu": "meta title rusă",
  "metaDescription": "meta description română (150-160 caractere)",
  "metaDescriptionRu": "meta description rusă",
  "keywords": "cuvinte, cheie, separate, prin, virgula",
  "keywordsRu": "ключевые, слова, через, запятую",
  "content": "articol complet în română în format Markdown cu headings H2/H3, liste, minim 600 cuvinte, optimizat SEO, include sfaturi practice pentru Moldova",
  "contentRu": "articol complet în rusă în format Markdown, minim 600 cuvinte"
}`;

  try {
    const text = await groqJSON(key, [{ role: "user", content: prompt }], 8192);
    return c.json(JSON.parse(text.replace(/```json|```/g, "").trim()));
  } catch (err) {
    return c.json({ error: String(err) }, 500);
  }
});

// ─── Export ──────────────────────────────────────────────────────────────────

export const onRequest = handle(app);

// ─── Scheduled: raport zilnic automat (Cloudflare Cron Trigger) ──────────────
// Configurează în CF Dashboard → Pages → teco → Settings → Functions → Cron Triggers
// Recomandare: "0 19 * * *"  (22:00 ora Chișinăului, UTC+3)

export const onScheduled: PagesFunction<Env> = async (context) => {
  const env = context.env as unknown as Env;
  if (!env.TELEGRAM_BOT_TOKEN || !env.TELEGRAM_CHAT_ID) return;

  const today = chisinauDate(0);
  const yesterday = chisinauDate(-1);

  const getStats = async (date: string) => {
    const [v, l] = await Promise.all([
      env.DB.prepare("SELECT COUNT(*) as cnt FROM sessions WHERE date = ?").bind(date).first<{ cnt: number }>(),
      env.DB.prepare("SELECT COUNT(*) as cnt FROM sessions WHERE date = ? AND is_lead = 1").bind(date).first<{ cnt: number }>(),
    ]);
    return { visitors: v?.cnt ?? 0, leads: l?.cnt ?? 0 };
  };

  const getOrderStats = async (date: string) => {
    const row = await env.DB.prepare(
      "SELECT COUNT(*) as cnt, COALESCE(SUM(total),0) as rev FROM orders WHERE date(timestamp) = ?"
    ).bind(date).first<{ cnt: number; rev: number }>();
    return { orders: row?.cnt ?? 0, revenue: row?.rev ?? 0 };
  };

  const [[todayStats, yesterdayStats], [todayOrders]] = await Promise.all([
    Promise.all([getStats(today), getStats(yesterday)]),
    Promise.all([getOrderStats(today)]),
  ]);

  const pct = (now: number, prev: number) => {
    if (prev === 0) return now > 0 ? " 🆕" : "";
    const diff = Math.round(((now - prev) / prev) * 100);
    return diff === 0 ? " (=)" : diff > 0 ? ` (+${diff}%)` : ` (${diff}%)`;
  };

  const dateLabel = new Intl.DateTimeFormat("ro-MD", {
    weekday: "long", day: "numeric", month: "long",
  }).format(new Date(today));

  const lines = [
    `📊 <b>Raport Zilnic — Teco.md</b>`,
    `<i>${esc(dateLabel)}</i>`,
    ``,
    `👥 Vizitatori: <b>${todayStats.visitors}</b>${pct(todayStats.visitors, yesterdayStats.visitors)}`,
    `🎯 Leaduri noi: <b>${todayStats.leads}</b>`,
    todayOrders.orders > 0
      ? `🛒 Comenzi: <b>${todayOrders.orders}</b> — ${todayOrders.revenue.toLocaleString("ro-MD")} MDL`
      : `🛒 Comenzi: 0`,
  ].join("\n");

  const tgUrl = `https://api.telegram.org/bot${env.TELEGRAM_BOT_TOKEN}/sendMessage`;
  await fetch(tgUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ chat_id: env.TELEGRAM_CHAT_ID, text: lines, parse_mode: "HTML" }),
  });
};
