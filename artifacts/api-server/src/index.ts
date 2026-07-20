import app from "./app";
import { logger } from "./lib/logger";
import { startDailyReportCron } from "./lib/cron";

const rawPort = process.env["PORT"];

if (!rawPort) {
  throw new Error(
    "PORT environment variable is required but was not provided.",
  );
}

const port = Number(rawPort);

if (Number.isNaN(port) || port <= 0) {
  throw new Error(`Invalid PORT value: "${rawPort}"`);
}

app.listen(port, (err) => {
  if (err) {
    logger.error({ err }, "Error listening on port");
    process.exit(1);
  }

  logger.info({ port }, "Server listening");

  // ── Supabase startup diagnostics ─────────────────────────
  const hasUrl        = !!process.env.VITE_SUPABASE_URL;
  const hasServiceKey = !!(process.env.SUPABASE_SERVICE_KEY ?? process.env.SUPABASE_SERVICE_ROLE_KEY);
  const hasAnonKey    = !!process.env.VITE_SUPABASE_PUBLISHABLE_KEY;

  if (!hasUrl || !hasAnonKey) {
    logger.warn("⚠️  Supabase NOT configured — sessions/analytics disabled.");
  } else if (!hasServiceKey) {
    logger.warn(
      "⚠️  Supabase: lipsă SUPABASE_SERVICE_ROLE_KEY — scrierile în sessions/sales/ip_rate_limits " +
      "vor eșua (RLS blochează anon key). Adaugă secretul din Supabase Dashboard → Settings → API → service_role."
    );
  } else {
    logger.info("✅ Supabase configurat cu service role key.");
  }
  // ─────────────────────────────────────────────────────────

  startDailyReportCron();
});
