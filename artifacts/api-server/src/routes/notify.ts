import { Router } from "express";
import {
  isTelegramConfigured,
  notifyVisitor,
  notifyFirstMessage,
  notifyLeadChat,
  notifyLeadCalculator,
  sendDailyReport,
  type SessionInfo,
} from "../services/telegram";
import {
  isSupabaseConfigured,
  upsertSession,
  markSessionAsLead,
  recordSale,
  getStatsForDate,
  getSalesForDate,
  chisinauDate,
  checkIpRateLimit,
} from "../services/supabase";

const router = Router();

// ─── Throttle state ───────────────────────────────────────────────────────────

// Fast in-memory dedup: sessionId → already notified (visitor).
const notifiedSessions = new Set<string>();

// In-memory fallback for visitor IP rate limiting.
// Map key: `${ip}:${date}`, value: count of notifications sent.
const ipVisitorCounts = new Map<string, number>();

// Per-session chat-notify counter (max 3 first-message notifications per session).
const chatNotifyCounts = new Map<string, number>();

// In-memory phone-lead dedup (backup to SQLite rate limit).
// Key: phone+date, value: timestamp first notified.
const notifiedPhones = new Map<string, number>();

const CHAT_NOTIFY_LIMIT = 3;
const VISITOR_IP_DAILY_LIMIT = 1;
const LEAD_PHONE_DAILY_LIMIT = 1; // max 1 notificare Telegram per telefon pe zi

/**
 * Returnează true dacă notificarea este permisă (primul lead de la acest telefon azi).
 * Folosește SQLite ca sursă de adevăr + in-memory ca fallback.
 */
async function canNotifyPhone(phone: string, today: string): Promise<boolean> {
  if (!phone) return true; // fără telefon → permite, TecoBot va decide
  const normalized = phone.replace(/\D/g, "");
  if (!normalized) return true;

  // 1. SQLite (persistent peste restartări)
  const dbResult = await checkIpRateLimit(normalized, today, "lead-notify", LEAD_PHONE_DAILY_LIMIT);
  if (dbResult !== null) return dbResult; // true = permis, false = blocat

  // 2. Fallback in-memory dacă SQLite a eșuat
  const key = `${normalized}:${today}`;
  if (notifiedPhones.has(key)) return false;
  notifiedPhones.set(key, Date.now());
  if (notifiedPhones.size > 5000) {
    for (const [k, ts] of notifiedPhones) {
      if (Date.now() - ts > 24 * 3600 * 1000) notifiedPhones.delete(k);
    }
  }
  return true;
}

// ─── Routes ───────────────────────────────────────────────────────────────────

// POST /api/notify/visitor — prima vizită pe site
router.post("/visitor", async (req, res) => {
  if (!isTelegramConfigured()) return res.json({ ok: true, skipped: "not configured" });

  const session: SessionInfo = req.body.session ?? req.body;
  const sessionId = session.sessionId;
  // req.ip is resolved by Express using the trusted proxy chain (trust proxy 1 in app.ts).
  // Do NOT read x-forwarded-for directly — that header is client-controlled and spoofable.
  const ip = req.ip ?? "unknown";
  const today = chisinauDate();

  // Fast path: same session already notified this process lifetime
  if (sessionId && notifiedSessions.has(sessionId)) {
    return res.json({ ok: true, skipped: "already notified" });
  }

  // IP-based rate limit: max 1 notification per IP per day.
  // Primary: atomic Supabase RPC (persistent across restarts).
  // Fallback: in-memory Map — used when Supabase is unconfigured OR when the
  //           RPC fails (table missing, transient error, etc.).
  const dbResult = await checkIpRateLimit(ip, today, "visitor", VISITOR_IP_DAILY_LIMIT);
  if (dbResult === null) {
    // DB unavailable — use in-memory fallback
    const key = `${ip}:${today}`;
    const count = ipVisitorCounts.get(key) ?? 0;
    if (count >= VISITOR_IP_DAILY_LIMIT) {
      return res.status(429).json({ ok: false, skipped: "rate limited" });
    }
    ipVisitorCounts.set(key, count + 1);
    // Evict stale keys to prevent memory leak
    if (ipVisitorCounts.size > 50000) {
      for (const [k] of ipVisitorCounts) {
        if (!k.endsWith(today)) ipVisitorCounts.delete(k);
      }
    }
  } else if (!dbResult) {
    // DB confirmed rate limit exceeded
    return res.status(429).json({ ok: false, skipped: "rate limited" });
  }

  // Mark session as notified for fast in-process dedup
  if (sessionId) {
    notifiedSessions.add(sessionId);
    if (notifiedSessions.size > 10000) notifiedSessions.clear();
  }

  // Persistă sesiunea în Supabase pentru raportul zilnic
  if (sessionId && isSupabaseConfigured()) {
    upsertSession({
      session_id: sessionId,
      date: today,
      referrer: session.referrer,
      utm_source: session.utmSource,
      utm_medium: session.utmMedium,
      country: session.country,
      device_type: session.deviceType,
      pages: (session.pages ?? []).map((p) => p.path),
      is_lead: false,
    }).catch(() => {});
  }

  notifyVisitor(session).catch(() => {});
  return res.json({ ok: true });
});

// POST /api/notify/chat-notify — primul mesaj în TecoBot (deja apelat din frontend)
// Rate limit: max 3 notificări per sesiune (previne spam dacă utilizatorul trimite mesaje rapid)
router.post("/chat-notify", async (req, res) => {
  if (!isTelegramConfigured()) return res.json({ ok: true, skipped: "not configured" });

  const { message = "", page = "/", session = {} } = req.body as {
    message: string;
    page: string;
    session?: SessionInfo;
  };

  const sessionId = (session as SessionInfo).sessionId;

  if (sessionId) {
    const count = chatNotifyCounts.get(sessionId) ?? 0;
    if (count >= CHAT_NOTIFY_LIMIT) {
      return res.status(429).json({ ok: false, skipped: "rate limited" });
    }
    chatNotifyCounts.set(sessionId, count + 1);
    // Evict old entries when map grows large
    if (chatNotifyCounts.size > 10000) chatNotifyCounts.clear();
  }

  notifyFirstMessage({ message, page, session }).catch(() => {});
  return res.json({ ok: true });
});

// POST /api/notify/chat-lead — lead capturat din AI chat cu transcriere completă
router.post("/chat-lead", async (req, res) => {
  if (!isTelegramConfigured()) return res.json({ ok: true, skipped: "not configured" });

  const { name = "", phone = "", messages = [], session = {} } = req.body as {
    name: string;
    phone: string;
    messages: { role: "user" | "assistant"; content: string }[];
    session?: SessionInfo;
  };

  const today = chisinauDate();

  // ── Dedup: nu trimite dacă același telefon a primit notificare azi ──
  const allowed = await canNotifyPhone(phone, today);
  if (!allowed) {
    return res.json({ ok: true, skipped: "duplicate phone today" });
  }

  // Marchează sesiunea ca lead în SQLite
  if ((session as SessionInfo).sessionId && isSupabaseConfigured()) {
    markSessionAsLead((session as SessionInfo).sessionId!, "chat").catch(() => {});
  }

  notifyLeadChat({ name, phone, messages, session }).catch(() => {});
  return res.json({ ok: true });
});

// POST /api/notify/calculator — lead din calculator cost
router.post("/calculator", async (req, res) => {
  if (!isTelegramConfigured()) return res.json({ ok: true, skipped: "not configured" });

  const {
    name = "",
    phone = "",
    selections = {},
    equipmentCost = 0,
    installCost = 0,
    totalCost = 0,
    session = {},
  } = req.body as {
    name: string;
    phone: string;
    selections: Record<string, string>;
    equipmentCost: number;
    installCost: number;
    totalCost: number;
    session?: SessionInfo;
  };

  const today = chisinauDate();

  // ── Dedup: nu trimite dacă același telefon a primit notificare azi ──
  const allowed = await canNotifyPhone(phone, today);
  if (!allowed) {
    return res.json({ ok: true, skipped: "duplicate phone today" });
  }

  // Marchează sesiunea ca lead în SQLite
  if ((session as SessionInfo).sessionId && isSupabaseConfigured()) {
    markSessionAsLead((session as SessionInfo).sessionId!, "calculator").catch(() => {});
  }

  notifyLeadCalculator({ name, phone, selections, equipmentCost, installCost, totalCost, session }).catch(() => {});
  return res.json({ ok: true });
});

// POST /api/notify/sale — înregistrează o vânzare confirmată (apelat manual de owner)
// Protejat cu același token ca daily-report
router.post("/sale", async (req, res) => {
  const cronSecret = process.env.CRON_SECRET ?? process.env.SESSION_SECRET;
  if (cronSecret) {
    const provided =
      (req.headers["x-cron-secret"] as string | undefined) ??
      (req.headers["authorization"] as string | undefined)?.replace("Bearer ", "") ??
      "";
    if (provided !== cronSecret) {
      return res.status(401).json({ ok: false, error: "Unauthorized" });
    }
  }

  if (!isSupabaseConfigured()) {
    return res.json({ ok: false, error: "Supabase not configured" });
  }

  const {
    amountMdl,
    description,
    sessionId,
    date,
  } = req.body as {
    amountMdl?: number;
    description?: string;
    sessionId?: string;
    date?: string;
  };

  await recordSale({
    date: date ?? chisinauDate(),
    amountMdl,
    description,
    sessionId,
  });

  return res.json({ ok: true, date: date ?? chisinauDate() });
});

// GET /api/notify/daily-report — trimite raportul zilnic în Telegram
// Protejat cu token partajat: header X-Cron-Secret sau query ?secret=
// Poate fi apelat de Cloudflare Cron Trigger (cu header) sau node-cron intern
router.get("/daily-report", async (req, res) => {
  // Verifică token-ul de autorizare (obligatoriu în producție)
  const cronSecret = process.env.CRON_SECRET ?? process.env.SESSION_SECRET;
  if (cronSecret) {
    const provided =
      (req.headers["x-cron-secret"] as string | undefined) ??
      (req.query["secret"] as string | undefined) ??
      "";
    if (provided !== cronSecret) {
      return res.status(401).json({ ok: false, error: "Unauthorized" });
    }
  }

  if (!isTelegramConfigured()) {
    return res.json({ ok: false, error: "Telegram not configured" });
  }
  if (!isSupabaseConfigured()) {
    return res.json({ ok: false, error: "Supabase not configured" });
  }

  const today = chisinauDate(0);
  const yesterday = chisinauDate(-1);

  const [todayStats, yesterdayStats, todaySales, yesterdaySales] = await Promise.all([
    getStatsForDate(today),
    getStatsForDate(yesterday),
    getSalesForDate(today),
    getSalesForDate(yesterday),
  ]);

  // Nu trimite dacă nu a fost niciun vizitator azi
  if (todayStats.visitors === 0) {
    return res.json({ ok: true, skipped: "no visitors today" });
  }

  await sendDailyReport({
    date: today,
    today: {
      ...todayStats,
      sales: todaySales.count,
      salesTotalMdl: todaySales.totalMdl,
    },
    yesterday: {
      visitors: yesterdayStats.visitors,
      leads: yesterdayStats.leads,
      sales: yesterdaySales.count,
    },
  });

  return res.json({
    ok: true,
    date: today,
    visitors: todayStats.visitors,
    leads: todayStats.leads,
    sales: todaySales.count,
  });
});

export default router;
