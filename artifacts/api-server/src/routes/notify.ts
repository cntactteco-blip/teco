import { Router } from "express";
import {
  isTelegramConfigured,
  notifyVisitor,
  notifyFirstMessage,
  notifyLeadChat,
  notifyLeadCalculator,
  type SessionInfo,
} from "../services/telegram";

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

  notifyLeadCalculator({ name, phone, selections, equipmentCost, installCost, totalCost, session }).catch(() => {});
  return res.json({ ok: true });
});

export default router;
