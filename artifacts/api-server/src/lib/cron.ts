import cron from "node-cron";
import { logger } from "./logger";

/**
 * Schedulează raportul zilnic la 20:00 ora Chișinău.
 * Chișinău = EET (UTC+2 iarnă) sau EEST (UTC+3 vară).
 * Rulăm cron la 17:00 UTC și 18:00 UTC, dar verificăm ora locală înainte de trimitere.
 * O variabilă de dată previne duplicatele dacă ambele sloturi se suprapun.
 */

let lastSentDate = "";

async function fireDailyReport() {
  // Verifică ora curentă în Chișinău
  const nowChisinau = new Date().toLocaleString("en-US", {
    timeZone: "Europe/Chisinau",
    hour: "numeric",
    hour12: false,
  });
  const hour = parseInt(nowChisinau, 10);

  // Acceptă ora 20 (19:30–20:59 pentru toleranță)
  if (hour !== 20) return;

  const today = new Date().toLocaleDateString("en-CA", {
    timeZone: "Europe/Chisinau",
  }); // YYYY-MM-DD

  if (lastSentDate === today) {
    logger.info("Daily report already sent today, skipping");
    return;
  }

  logger.info({ date: today }, "Sending daily Telegram report");

  try {
    const baseUrl = `http://localhost:${process.env.PORT}/api`;
    const cronSecret = process.env.CRON_SECRET ?? process.env.SESSION_SECRET ?? "";
    const res = await fetch(`${baseUrl}/notify/daily-report`, {
      headers: { "x-cron-secret": cronSecret },
    });
    const data = await res.json() as { ok: boolean; skipped?: string; visitors?: number; leads?: number };

    // Marchează trimis DOAR dacă răspunsul HTTP și payload confirmă succesul
    if (!res.ok || !data.ok) {
      logger.error({ status: res.status, data }, "Daily report endpoint returned failure; will retry next slot");
      return;
    }

    lastSentDate = today;

    if (data.skipped) {
      logger.info({ reason: data.skipped }, "Daily report skipped");
    } else {
      logger.info({ visitors: data.visitors, leads: data.leads }, "Daily report sent");
    }
  } catch (err) {
    logger.error({ err }, "Daily report cron failed");
  }
}

export function startDailyReportCron() {
  // 17:00 UTC — acoperă EEST (UTC+3) => 20:00 Chișinău vara
  cron.schedule("0 17 * * *", fireDailyReport, { timezone: "UTC" });
  // 18:00 UTC — acoperă EET (UTC+2)  => 20:00 Chișinău iarna
  cron.schedule("0 18 * * *", fireDailyReport, { timezone: "UTC" });

  logger.info("Daily report cron scheduled (17:00 UTC + 18:00 UTC)");
}
