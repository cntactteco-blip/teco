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
} from "../services/supabase";

const router = Router();

// Throttle: un singur mesaj per sessionId pentru vizitator nou
const notifiedSessions = new Set<string>();

// POST /api/notify/visitor — prima vizită pe site
router.post("/visitor", async (req, res) => {
  if (!isTelegramConfigured()) return res.json({ ok: true, skipped: "not configured" });

  const session: SessionInfo = req.body.session ?? req.body;
  const sessionId = session.sessionId;

  if (sessionId && notifiedSessions.has(sessionId)) {
    return res.json({ ok: true, skipped: "already notified" });
  }
  if (sessionId) notifiedSessions.add(sessionId);

  // Curăță setul din memorie după 24h (evită memory leak)
  if (notifiedSessions.size > 10000) notifiedSessions.clear();

  // Persistă sesiunea în Supabase pentru raportul zilnic
  if (sessionId && isSupabaseConfigured()) {
    upsertSession({
      session_id: sessionId,
      date: chisinauDate(),
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

// POST /api/chat-notify — primul mesaj în TecoBot (deja apelat din frontend)
router.post("/chat-notify", async (req, res) => {
  if (!isTelegramConfigured()) return res.json({ ok: true, skipped: "not configured" });

  const { message = "", page = "/", session = {} } = req.body as {
    message: string;
    page: string;
    session?: SessionInfo;
  };

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

  // Marchează sesiunea ca lead în Supabase
  if (session.sessionId && isSupabaseConfigured()) {
    markSessionAsLead(session.sessionId, "chat").catch(() => {});
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

  // Marchează sesiunea ca lead în Supabase
  if (session.sessionId && isSupabaseConfigured()) {
    markSessionAsLead(session.sessionId, "calculator").catch(() => {});
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
