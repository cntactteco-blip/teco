// eslint-disable-next-line @typescript-eslint/no-explicit-any
import { createClient } from "@supabase/supabase-js";

// ─── Session row shape (matches the `sessions` table) ────────────────────────

interface SessionRecord {
  session_id: string;
  date: string;
  referrer: string | null;
  utm_source: string | null;
  utm_medium: string | null;
  country: string | null;
  device_type: string | null;
  pages: string[] | null;
  is_lead: boolean;
  lead_type: string | null;
}

// ─── Client (lazy singleton) ──────────────────────────────────────────────────
// We skip the Database generic because its internal shape changes between
// supabase-js minor versions and causes "never" inference. We cast results
// at each call site using the explicit SessionRecord type above.

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let _client: ReturnType<typeof createClient> | null | undefined = undefined;

function db(): ReturnType<typeof createClient> | null {
  if (_client === undefined) {
    const url = process.env.VITE_SUPABASE_URL;
    // Prefer service role key (bypasses RLS, required for server-side writes).
    // Falls back to publishable key for local dev without service key configured.
    const key =
      process.env.SUPABASE_SERVICE_KEY ??
      process.env.SUPABASE_SERVICE_ROLE_KEY ??
      process.env.VITE_SUPABASE_PUBLISHABLE_KEY;

    if (url && key) {
      if (!process.env.SUPABASE_SERVICE_KEY && !process.env.SUPABASE_SERVICE_ROLE_KEY) {
        console.warn(
          "[supabase] No SUPABASE_SERVICE_KEY found — using publishable key. " +
          "Set SUPABASE_SERVICE_KEY in env secrets for proper RLS security.",
        );
      }
      _client = createClient(url, key, { auth: { persistSession: false } });
    } else {
      _client = null;
    }
  }
  return _client;
}

export function isSupabaseConfigured(): boolean {
  return !!db();
}

// ─── Public types ─────────────────────────────────────────────────────────────

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

export interface DailyStats {
  visitors: number;
  leads: number;
  leadsChat: number;
  leadsCalculator: number;
  topPages: { path: string; count: number }[];
  topSources: { source: string; count: number }[];
}

export interface DailySales {
  count: number;
  totalMdl: number;
}

const EMPTY_STATS: DailyStats = {
  visitors: 0, leads: 0, leadsChat: 0, leadsCalculator: 0,
  topPages: [], topSources: [],
};

const EMPTY_SALES: DailySales = { count: 0, totalMdl: 0 };

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Today's date string in Europe/Chisinau timezone (YYYY-MM-DD) */
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

// ─── Sales helpers ────────────────────────────────────────────────────────────

interface SaleRecord {
  id: string;
  date: string;
  amount_mdl: number | null;
  description: string | null;
  session_id: string | null;
}

/** Record a confirmed sale. */
export async function recordSale(opts: {
  date: string;
  amountMdl?: number;
  description?: string;
  sessionId?: string;
}): Promise<void> {
  const client = db();
  if (!client) return;

  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const q = client.from("sales") as any;
    const { error } = await q.insert({
      date: opts.date,
      amount_mdl: opts.amountMdl ?? null,
      description: opts.description ?? null,
      session_id: opts.sessionId ?? null,
    });
    if (error) console.error("Supabase recordSale:", (error as { message: string }).message);
  } catch (err) {
    console.error("Supabase recordSale failed:", err);
  }
}

/** Aggregate sales totals for a given date. */
export async function getSalesForDate(date: string): Promise<DailySales> {
  const client = db();
  if (!client) return { ...EMPTY_SALES };

  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const q = client.from("sales") as any;
    const { data, error } = await q
      .select("amount_mdl")
      .eq("date", date);

    if (error) {
      console.error("Supabase getSalesForDate:", (error as { message: string }).message);
      return { ...EMPTY_SALES };
    }

    const rows = (data ?? []) as SaleRecord[];
    const count = rows.length;
    const totalMdl = rows.reduce((sum, r) => sum + (r.amount_mdl ?? 0), 0);
    return { count, totalMdl };
  } catch (err) {
    console.error("Supabase getSalesForDate failed:", err);
    return { ...EMPTY_SALES };
  }
}

// ─── IP Rate Limiting ─────────────────────────────────────────────────────────

/**
 * Atomically increment the daily counter for (ip, date, type) via a Postgres RPC
 * function and check the result against `limit`.
 *
 * Returns:
 *   true  — request is ALLOWED (counter was below the limit before increment)
 *   false — request is RATE LIMITED (counter already at or over limit)
 *   null  — DB unavailable or table missing; caller must apply its own fallback
 *
 * The RPC `increment_ip_rate_limit` uses INSERT … ON CONFLICT DO UPDATE so the
 * increment is atomic — no TOCTOU race between select and upsert.
 */
export async function checkIpRateLimit(
  ip: string,
  date: string,
  type: string,
  limit: number,
): Promise<boolean | null> {
  const client = db();
  if (!client) return null; // Supabase not configured

  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (client as any).rpc("increment_ip_rate_limit", {
      p_ip: ip,
      p_date: date,
      p_type: type,
    });

    if (error) {
      // Table or function probably doesn't exist yet — signal caller to use fallback
      console.warn("ip_rate_limits RPC error:", (error as { message: string }).message);
      return null;
    }

    // `data` is the new count after increment
    const newCount = data as number;
    return newCount <= limit; // true = allowed, false = rate limited
  } catch (err) {
    console.error("checkIpRateLimit failed:", err);
    return null; // signal caller to use fallback
  }
}

// ─── Write ────────────────────────────────────────────────────────────────────

/** Upsert a session row (insert on first visit, update on revisit). */
export async function upsertSession(row: SessionRow): Promise<void> {
  const client = db();
  if (!client) return;

  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const q = client.from("sessions") as any;
    const { error } = await q.upsert(
      {
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
      },
      { onConflict: "session_id" },
    );
    if (error) console.error("Supabase upsertSession:", (error as { message: string }).message);
  } catch (err) {
    console.error("Supabase upsertSession failed:", err);
  }
}

/** Mark an existing session as a lead. */
export async function markSessionAsLead(
  sessionId: string,
  leadType: "chat" | "calculator",
): Promise<void> {
  const client = db();
  if (!client) return;

  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const q = client.from("sessions") as any;
    const { error } = await q
      .update({ is_lead: true, lead_type: leadType })
      .eq("session_id", sessionId);
    if (error) console.error("Supabase markSessionAsLead:", (error as { message: string }).message);
  } catch (err) {
    console.error("Supabase markSessionAsLead failed:", err);
  }
}

// ─── Read ─────────────────────────────────────────────────────────────────────

/** Aggregate daily stats for a date string (YYYY-MM-DD). */
export async function getStatsForDate(date: string): Promise<DailyStats> {
  const client = db();
  if (!client) return { ...EMPTY_STATS };

  try {
    const { data, error } = await client
      .from("sessions")
      .select("session_id, pages, is_lead, lead_type, referrer, utm_source, utm_medium")
      .eq("date", date);

    if (error) {
      console.error("Supabase getStatsForDate:", (error as { message: string }).message);
      return { ...EMPTY_STATS };
    }

    const rows = (data ?? []) as SessionRecord[];
    const visitors = rows.length;
    const leads = rows.filter((r) => r.is_lead).length;
    const leadsChat = rows.filter((r) => r.lead_type === "chat").length;
    const leadsCalculator = rows.filter((r) => r.lead_type === "calculator").length;

    // Top pages — flatten pages arrays and count occurrences
    const pageCounts: Record<string, number> = {};
    for (const row of rows) {
      const pages: string[] = Array.isArray(row.pages) ? row.pages : [];
      for (const p of pages) {
        pageCounts[p] = (pageCounts[p] ?? 0) + 1;
      }
    }
    const topPages = Object.entries(pageCounts)
      .map(([path, count]) => ({ path, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    // Top sources
    const srcCounts: Record<string, number> = {};
    for (const row of rows) {
      const src = formatSourceKey(
        row.referrer ?? "",
        row.utm_source ?? "",
        row.utm_medium ?? "",
      );
      srcCounts[src] = (srcCounts[src] ?? 0) + 1;
    }
    const topSources = Object.entries(srcCounts)
      .map(([source, count]) => ({ source, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 3);

    return { visitors, leads, leadsChat, leadsCalculator, topPages, topSources };
  } catch (err) {
    console.error("Supabase getStatsForDate failed:", err);
    return { ...EMPTY_STATS };
  }
}

function formatSourceKey(referrer: string, utmSource: string, utmMedium: string): string {
  if (utmSource) return `${utmSource}${utmMedium ? ` / ${utmMedium}` : ""}`;
  if (!referrer) return "Direct";
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
