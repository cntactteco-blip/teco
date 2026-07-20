/**
 * services/supabase.ts — înlocuit complet cu SQLite local.
 * Exportă exact același API (aceleași funcții și tipuri) astfel încât
 * notify.ts și restul codului nu necesită nicio modificare.
 */

import {
  upsertSession as dbUpsertSession,
  markSessionAsLead as dbMarkSessionAsLead,
  getStatsForDate as dbGetStatsForDate,
  getSalesForDate as dbGetSalesForDate,
  recordSale as dbRecordSale,
  checkIpRateLimit as dbCheckIpRateLimit,
  type DailyStats,
  type DailySales,
} from "../db";

// ─── Tipuri publice (identice cu versiunea Supabase) ──────────────────────────

export interface SessionRow {
  session_id: string;
  date: string;
  referrer?: string;
  utm_source?: string;
  utm_medium?: string;
  country?: string;
  device_type?: string;
  pages?: string[];
  is_lead: boolean;
  lead_type?: string;
}

export { DailyStats, DailySales };

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Astăzi în timezone Europe/Chisinau (YYYY-MM-DD) */
export function chisinauDate(offsetDays = 0): string {
  const d = new Date(
    new Date().toLocaleString("en-US", { timeZone: "Europe/Chisinau" }),
  );
  d.setDate(d.getDate() + offsetDays);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

// SQLite e mereu configurat — funcție păstrată pentru compatibilitate
export function isSupabaseConfigured(): boolean {
  return true;
}

// ─── Sessions ─────────────────────────────────────────────────────────────────

export async function upsertSession(row: SessionRow): Promise<void> {
  try {
    dbUpsertSession({
      session_id: row.session_id,
      date: row.date,
      referrer: row.referrer ?? null,
      utm_source: row.utm_source ?? null,
      utm_medium: row.utm_medium ?? null,
      country: row.country ?? null,
      device_type: row.device_type ?? null,
      pages: row.pages ?? [],
      is_lead: row.is_lead,
      lead_type: row.lead_type ?? null,
    });
  } catch (err) {
    console.error("[db] upsertSession failed:", err);
  }
}

export async function markSessionAsLead(
  sessionId: string,
  leadType: "chat" | "calculator",
): Promise<void> {
  try {
    dbMarkSessionAsLead(sessionId, leadType);
  } catch (err) {
    console.error("[db] markSessionAsLead failed:", err);
  }
}

// ─── Stats & Sales ────────────────────────────────────────────────────────────

export async function getStatsForDate(date: string): Promise<DailyStats> {
  try { return dbGetStatsForDate(date); } catch { return { visitors: 0, leads: 0, leadsChat: 0, leadsCalculator: 0, topPages: [], topSources: [] }; }
}

export async function getSalesForDate(date: string): Promise<DailySales> {
  try { return dbGetSalesForDate(date); } catch { return { count: 0, totalMdl: 0 }; }
}

export async function recordSale(opts: {
  date: string;
  amountMdl?: number;
  description?: string;
  sessionId?: string;
}): Promise<void> {
  try { dbRecordSale(opts); } catch (err) { console.error("[db] recordSale failed:", err); }
}

// ─── IP Rate Limiting ──────────────────────────────────────────────────────────

/**
 * Returnează: true = permis, false = blocat, null = eroare (folosiți fallback in-memory)
 */
export async function checkIpRateLimit(
  ip: string,
  date: string,
  type: string,
  limit: number,
): Promise<boolean | null> {
  try {
    return dbCheckIpRateLimit(ip, date, type, limit);
  } catch (err) {
    console.error("[db] checkIpRateLimit failed:", err);
    return null; // fallback la in-memory
  }
}
