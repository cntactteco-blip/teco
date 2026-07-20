/**
 * db.ts — SQLite local, înlocuiește complet Supabase.
 * Fișier: ./data/teco.db (persistent pe Replit, gratuit, niciodată offline)
 */

import Database from "better-sqlite3";
import path from "path";
import fs from "fs";

const dataDir = path.join(process.cwd(), "data");
fs.mkdirSync(dataDir, { recursive: true });

const DB_PATH = path.join(dataDir, "teco.db");
const db = new Database(DB_PATH);

// Optimizări performanță
db.pragma("journal_mode = WAL");
db.pragma("synchronous = NORMAL");
db.pragma("foreign_keys = ON");

// ─── Schema ────────────────────────────────────────────────────────────────────
db.exec(`
  CREATE TABLE IF NOT EXISTS settings (
    id   INTEGER PRIMARY KEY,
    data TEXT    NOT NULL
  );

  CREATE TABLE IF NOT EXISTS products (
    id               INTEGER PRIMARY KEY,
    name             TEXT,
    model            TEXT,
    brand            TEXT,
    price            REAL,
    old_price        REAL,
    specs            TEXT,
    badge            TEXT,
    category         TEXT,
    image_url        TEXT,
    images           TEXT DEFAULT '[]',
    description      TEXT DEFAULT '',
    long_description TEXT,
    tech_specs       TEXT,
    in_stock         INTEGER DEFAULT 1,
    icon             TEXT DEFAULT 'camera',
    created_at       TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS leads (
    id         TEXT PRIMARY KEY,
    name       TEXT,
    phone      TEXT,
    message    TEXT,
    source     TEXT,
    timestamp  TEXT DEFAULT (datetime('now')),
    status     TEXT DEFAULT 'new',
    notes      TEXT,
    selections TEXT
  );

  CREATE TABLE IF NOT EXISTS orders (
    id         TEXT PRIMARY KEY,
    customer   TEXT,
    items      TEXT,
    total      REAL,
    timestamp  TEXT DEFAULT (datetime('now')),
    status     TEXT DEFAULT 'pending'
  );

  CREATE TABLE IF NOT EXISTS blog_posts (
    id                 TEXT PRIMARY KEY,
    slug               TEXT UNIQUE,
    title              TEXT,
    title_ru           TEXT,
    description        TEXT,
    description_ru     TEXT,
    content            TEXT,
    content_ru         TEXT,
    image_url          TEXT,
    category           TEXT,
    category_ru        TEXT,
    published_at       TEXT,
    updated_at         TEXT,
    author             TEXT,
    meta_title         TEXT,
    meta_title_ru      TEXT,
    meta_description   TEXT,
    meta_description_ru TEXT,
    keywords           TEXT,
    keywords_ru        TEXT,
    published          INTEGER DEFAULT 1,
    reading_time       INTEGER
  );

  CREATE TABLE IF NOT EXISTS sessions (
    session_id  TEXT PRIMARY KEY,
    date        TEXT,
    referrer    TEXT,
    utm_source  TEXT,
    utm_medium  TEXT,
    country     TEXT,
    device_type TEXT,
    pages       TEXT DEFAULT '[]',
    is_lead     INTEGER DEFAULT 0,
    lead_type   TEXT
  );

  CREATE TABLE IF NOT EXISTS sales (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    date        TEXT,
    amount_mdl  REAL,
    description TEXT,
    session_id  TEXT
  );

  CREATE TABLE IF NOT EXISTS ip_rate_limits (
    ip    TEXT NOT NULL,
    date  TEXT NOT NULL,
    type  TEXT NOT NULL,
    count INTEGER DEFAULT 0,
    PRIMARY KEY (ip, date, type)
  );
`);

// ─── Settings ──────────────────────────────────────────────────────────────────

export function getSettings(): unknown | null {
  const row = db.prepare("SELECT data FROM settings WHERE id = 1").get() as { data: string } | undefined;
  if (!row) return null;
  try { return JSON.parse(row.data); } catch { return null; }
}

export function saveSettings(data: unknown): void {
  db.prepare("INSERT OR REPLACE INTO settings (id, data) VALUES (1, ?)").run(JSON.stringify(data));
}

// ─── Products ──────────────────────────────────────────────────────────────────

export function getProducts(): unknown[] {
  const rows = db.prepare("SELECT * FROM products ORDER BY id").all() as Record<string, unknown>[];
  return rows.map((r) => ({
    ...r,
    images: JSON.parse((r.images as string) || "[]"),
    in_stock: Boolean(r.in_stock),
  }));
}

export function upsertProduct(p: Record<string, unknown>): void {
  db.prepare(`
    INSERT OR REPLACE INTO products
      (id, name, model, brand, price, old_price, specs, badge, category,
       image_url, images, description, long_description, tech_specs, in_stock, icon)
    VALUES
      (@id, @name, @model, @brand, @price, @old_price, @specs, @badge, @category,
       @image_url, @images, @description, @long_description, @tech_specs, @in_stock, @icon)
  `).run({
    ...p,
    images: JSON.stringify(Array.isArray(p.images) ? p.images : []),
    in_stock: p.in_stock ? 1 : 0,
  });
}

export function deleteProduct(id: number): void {
  db.prepare("DELETE FROM products WHERE id = ?").run(id);
}

export function countProducts(): number {
  return ((db.prepare("SELECT COUNT(*) as n FROM products").get()) as { n: number }).n;
}

// ─── Leads ─────────────────────────────────────────────────────────────────────

export function getLeads(): unknown[] {
  const rows = db.prepare("SELECT * FROM leads ORDER BY timestamp DESC").all() as Record<string, unknown>[];
  return rows.map((r) => ({
    ...r,
    selections: r.selections ? JSON.parse(r.selections as string) : undefined,
  }));
}

export function upsertLead(lead: Record<string, unknown>): void {
  db.prepare(`
    INSERT OR REPLACE INTO leads (id, name, phone, message, source, timestamp, status, notes, selections)
    VALUES (@id, @name, @phone, @message, @source, @timestamp, @status, @notes, @selections)
  `).run({
    ...lead,
    selections: lead.selections ? JSON.stringify(lead.selections) : null,
  });
}

export function updateLeadStatus(id: string, status: string): void {
  db.prepare("UPDATE leads SET status = ? WHERE id = ?").run(status, id);
}

export function updateLeadNotes(id: string, notes: string): void {
  db.prepare("UPDATE leads SET notes = ? WHERE id = ?").run(notes, id);
}

export function deleteLead(id: string): void {
  db.prepare("DELETE FROM leads WHERE id = ?").run(id);
}

// ─── Orders ────────────────────────────────────────────────────────────────────

export function getOrders(): unknown[] {
  const rows = db.prepare("SELECT * FROM orders ORDER BY timestamp DESC").all() as Record<string, unknown>[];
  return rows.map((r) => ({
    ...r,
    customer: JSON.parse((r.customer as string) || "{}"),
    items: JSON.parse((r.items as string) || "[]"),
  }));
}

export function upsertOrder(order: Record<string, unknown>): void {
  db.prepare(`
    INSERT OR REPLACE INTO orders (id, customer, items, total, timestamp, status)
    VALUES (@id, @customer, @items, @total, @timestamp, @status)
  `).run({
    ...order,
    customer: JSON.stringify(order.customer),
    items: JSON.stringify(order.items),
  });
}

export function updateOrderStatus(id: string, status: string): void {
  db.prepare("UPDATE orders SET status = ? WHERE id = ?").run(status, id);
}

export function deleteOrder(id: string): void {
  db.prepare("DELETE FROM orders WHERE id = ?").run(id);
}

// ─── Blog posts ────────────────────────────────────────────────────────────────

export function getBlogPosts(): unknown[] {
  return db.prepare("SELECT * FROM blog_posts ORDER BY published_at DESC").all();
}

export function upsertBlogPost(post: Record<string, unknown>): void {
  const cols = Object.keys(post);
  const placeholders = cols.map((c) => `@${c}`).join(", ");
  db.prepare(`INSERT OR REPLACE INTO blog_posts (${cols.join(", ")}) VALUES (${placeholders})`).run(post);
}

export function deleteBlogPost(id: string): void {
  db.prepare("DELETE FROM blog_posts WHERE id = ?").run(id);
}

// ─── Sessions & Stats (pentru raportul zilnic Telegram) ───────────────────────

export function upsertSession(s: {
  session_id: string; date: string; referrer?: string | null;
  utm_source?: string | null; utm_medium?: string | null;
  country?: string | null; device_type?: string | null;
  pages?: string[]; is_lead?: boolean; lead_type?: string | null;
}): void {
  db.prepare(`
    INSERT OR REPLACE INTO sessions
      (session_id, date, referrer, utm_source, utm_medium, country, device_type, pages, is_lead, lead_type)
    VALUES
      (@session_id, @date, @referrer, @utm_source, @utm_medium, @country, @device_type, @pages, @is_lead, @lead_type)
  `).run({ ...s, pages: JSON.stringify(s.pages ?? []), is_lead: s.is_lead ? 1 : 0 });
}

export function markSessionAsLead(sessionId: string, leadType: string): void {
  db.prepare("UPDATE sessions SET is_lead = 1, lead_type = ? WHERE session_id = ?").run(leadType, sessionId);
}

export interface DailyStats {
  visitors: number; leads: number; leadsChat: number; leadsCalculator: number;
  topPages: { path: string; count: number }[];
  topSources: { source: string; count: number }[];
}
export interface DailySales { count: number; totalMdl: number; }

export function getStatsForDate(date: string): DailyStats {
  const sessions = db.prepare("SELECT * FROM sessions WHERE date = ?").all(date) as Record<string, unknown>[];
  const visitors = sessions.length;
  const leads = sessions.filter((s) => s.is_lead).length;
  const leadsChat = sessions.filter((s) => s.lead_type === "chat").length;
  const leadsCalculator = sessions.filter((s) => s.lead_type === "calculator").length;

  const pageCounts: Record<string, number> = {};
  const srcCounts: Record<string, number> = {};
  for (const s of sessions) {
    const pages: string[] = JSON.parse((s.pages as string) || "[]");
    for (const p of pages) pageCounts[p] = (pageCounts[p] ?? 0) + 1;
    const src = formatSourceKey(
      (s.referrer as string) ?? "", (s.utm_source as string) ?? "", (s.utm_medium as string) ?? ""
    );
    srcCounts[src] = (srcCounts[src] ?? 0) + 1;
  }

  return {
    visitors, leads, leadsChat, leadsCalculator,
    topPages: Object.entries(pageCounts).map(([path, count]) => ({ path, count })).sort((a, b) => b.count - a.count).slice(0, 5),
    topSources: Object.entries(srcCounts).map(([source, count]) => ({ source, count })).sort((a, b) => b.count - a.count).slice(0, 3),
  };
}

export function recordSale(opts: { date: string; amountMdl?: number; description?: string; sessionId?: string }): void {
  db.prepare("INSERT INTO sales (date, amount_mdl, description, session_id) VALUES (?, ?, ?, ?)")
    .run(opts.date, opts.amountMdl ?? null, opts.description ?? null, opts.sessionId ?? null);
}

export function getSalesForDate(date: string): DailySales {
  const rows = db.prepare("SELECT amount_mdl FROM sales WHERE date = ?").all(date) as { amount_mdl: number | null }[];
  return { count: rows.length, totalMdl: rows.reduce((s, r) => s + (r.amount_mdl ?? 0), 0) };
}

// ─── IP Rate Limiting ──────────────────────────────────────────────────────────

/** Returnează true dacă requestul e permis, false dacă e blocat. */
export function checkIpRateLimit(ip: string, date: string, type: string, limit: number): boolean {
  const row = db.prepare(
    "SELECT count FROM ip_rate_limits WHERE ip = ? AND date = ? AND type = ?"
  ).get(ip, date, type) as { count: number } | undefined;
  const current = row?.count ?? 0;
  if (current >= limit) return false;
  db.prepare(`
    INSERT INTO ip_rate_limits (ip, date, type, count) VALUES (?, ?, ?, 1)
    ON CONFLICT(ip, date, type) DO UPDATE SET count = count + 1
  `).run(ip, date, type);
  return true;
}

// ─── Seed produse din snapshot (la prima pornire) ─────────────────────────────

export function seedProductsIfEmpty(products: Record<string, unknown>[]): void {
  if (countProducts() > 0) return;
  const insert = db.prepare(`
    INSERT OR IGNORE INTO products (id, name, model, brand, price, old_price, specs, badge, category, image_url, images, description, in_stock, icon)
    VALUES (@id, @name, @model, @brand, @price, @old_price, @specs, @badge, @category, @image_url, @images, @description, @in_stock, @icon)
  `);
  db.transaction((prods: Record<string, unknown>[]) => {
    for (const p of prods) insert.run({ ...p, images: JSON.stringify(p.images ?? []), in_stock: 1 });
  })(products);
  console.log(`[db] Seeded ${products.length} products from snapshot.`);
}

// ─── Helpers ───────────────────────────────────────────────────────────────────

function formatSourceKey(referrer: string, utmSource: string, utmMedium: string): string {
  if (utmSource) return `${utmSource}${utmMedium ? ` / ${utmMedium}` : ""}`;
  if (!referrer) return "Direct";
  try {
    const host = new URL(referrer).hostname;
    if (host.includes("google")) return "Google";
    if (host.includes("facebook") || host.includes("fb.com")) return "Facebook";
    if (host.includes("instagram")) return "Instagram";
    if (host.includes("tiktok")) return "TikTok";
    return host;
  } catch { return "Direct"; }
}

export default db;
