const TELEGRAM_API = "https://api.telegram.org/bot";

export function isTelegramConfigured(): boolean {
  return !!(process.env.TELEGRAM_BOT_TOKEN && process.env.TELEGRAM_CHAT_ID);
}

export async function sendMessage(text: string): Promise<void> {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;
  if (!token || !chatId) return;

  try {
    const res = await fetch(`${TELEGRAM_API}${token}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: chatId,
        text: text.slice(0, 4096),
        parse_mode: "HTML",
        disable_web_page_preview: true,
      }),
    });
    const data = await res.json() as { ok: boolean; description?: string };
    if (!data.ok) console.error("Telegram:", data.description);
  } catch (err) {
    console.error("Telegram send failed:", err);
  }
}

// ─── Helpers ────────────────────────────────────────────────────────

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
    hour: "2-digit", minute: "2-digit",
    timeZone: "Europe/Chisinau",
  });
}

function formatDur(seconds: number): string {
  if (seconds < 60) return `${seconds}s`;
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return s > 0 ? `${m}m ${s}s` : `${m}m`;
}

// ─── Session type ────────────────────────────────────────────────────

export interface SessionInfo {
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

// ─── Notification builders ────────────────────────────────────────────

export async function notifyVisitor(session: SessionInfo): Promise<void> {
  const loc = [session.city, session.country].filter(Boolean).join(", ");
  const src = formatSource(session.referrer || "", session.utmSource || "", session.utmMedium || "");
  const dev = session.deviceType === "mobile" ? "📱 Mobil" : session.deviceType === "tablet" ? "📊 Tabletă" : "💻 Desktop";
  const page = session.pages?.[0]?.path || "/";
  const time = formatTime(session.startedAt || Date.now());
  const flagEmoji = flag(session.country || "");

  const lines = [
    `🔔 <b>Vizitator Nou pe Teco.md</b>`,
    ``,
    `🕐 ${time}  ${flagEmoji} <b>${esc(loc || "Locație necunoscută")}</b>`,
    `🌐 Sursă: <b>${esc(src)}</b>`,
    `📄 Pagină: <code>${esc(page)}</code>`,
    `${dev}  |  ${esc(session.browser || "Browser")}`,
    session.isp ? `🔌 ${esc(session.isp)}` : "",
  ].filter(Boolean).join("\n");

  await sendMessage(lines);
}

export async function notifyFirstMessage(payload: {
  message: string;
  page: string;
  session: SessionInfo;
}): Promise<void> {
  const loc = [payload.session.city, payload.session.country].filter(Boolean).join(", ");
  const src = formatSource(
    payload.session.referrer || "",
    payload.session.utmSource || "",
    payload.session.utmMedium || "",
  );
  const flagEmoji = flag(payload.session.country || "");
  const time = formatTime(payload.session.startedAt || Date.now());

  const lines = [
    `💬 <b>TecoBot — Mesaj Nou</b>`,
    ``,
    `🕐 ${time}  ${flagEmoji} <b>${esc(loc || "Locație necunoscută")}</b>`,
    `🌐 Sursă: ${esc(src)}`,
    `📄 Pagina: <code>${esc(payload.page)}</code>`,
    ``,
    `👤 <i>"${esc(payload.message)}"</i>`,
  ].join("\n");

  await sendMessage(lines);
}

export async function notifyLeadChat(payload: {
  name: string;
  phone: string;
  messages: { role: "user" | "assistant"; content: string }[];
  session: SessionInfo;
}): Promise<void> {
  const { name, phone, messages, session } = payload;
  const loc = [session.city, session.country].filter(Boolean).join(", ");
  const src = formatSource(session.referrer || "", session.utmSource || "", session.utmMedium || "");
  const flagEmoji = flag(session.country || "");
  const dur = formatDur(session.duration ?? 0);
  const dev = session.deviceType === "mobile" ? "📱" : "💻";

  const pagesText = (session.pages || [])
    .map((p) => `• ${esc(p.path)}`)
    .slice(0, 8)
    .join("\n") || "• /";

  // Transcript — ultimele 20 mesaje, fără greeting și fără LEAD_CAPTURED
  const transcript = messages
    .filter((m) => !m.content.includes("LEAD_CAPTURED"))
    .slice(-20)
    .map((m) => {
      const role = m.role === "user" ? "👤" : "🤖";
      const text = m.content.replace(/LEAD_CAPTURED:[^\n]*/g, "").trim().slice(0, 300);
      return `${role} ${esc(text)}`;
    })
    .join("\n");

  const lines = [
    `🤖 <b>Lead Nou — TecoBot AI</b>`,
    ``,
    `👤 <b>${esc(name)}</b>  |  📞 <code>${esc(phone)}</code>`,
    ``,
    `🕐 ${formatTime(session.startedAt || Date.now())}  ${flagEmoji} ${esc(loc || "?")}  ${dev}`,
    `🌐 Sursă: ${esc(src)}  |  ⏱ ${dur} pe site`,
    ``,
    `📄 <b>Pagini vizitate:</b>`,
    pagesText,
    ``,
    `💬 <b>Conversație:</b>`,
    `─────────────────`,
    transcript,
    `─────────────────`,
  ].join("\n");

  await sendMessage(lines);
}

export async function notifyLeadCalculator(payload: {
  name: string;
  phone: string;
  selections: {
    objective?: string;
    cameras?: string;
    storage?: string;
    installation?: string;
  };
  equipmentCost: number;
  installCost: number;
  totalCost: number;
  session: SessionInfo;
}): Promise<void> {
  const { name, phone, selections, equipmentCost, installCost, totalCost, session } = payload;
  const loc = [session.city, session.country].filter(Boolean).join(", ");
  const src = formatSource(session.referrer || "", session.utmSource || "", session.utmMedium || "");
  const flagEmoji = flag(session.country || "");
  const dur = formatDur(session.duration ?? 0);

  const pagesSummary = (session.pages || [])
    .map((p) => p.path)
    .slice(0, 5)
    .join(" → ") || "/";

  const lines = [
    `🧮 <b>Lead Nou — Calculator Cost</b>`,
    ``,
    `👤 <b>${esc(name || "Anonim")}</b>  |  📞 <code>${esc(phone)}</code>`,
    ``,
    `🕐 ${formatTime(session.startedAt || Date.now())}  ${flagEmoji} ${esc(loc || "?")}`,
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
  ].join("\n");

  await sendMessage(lines);
}
