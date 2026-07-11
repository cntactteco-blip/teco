import { createClient } from "@supabase/supabase-js";
import { writeFileSync } from "fs";
import { fileURLToPath } from "url";
import path from "path";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.join(__dirname, "../src/lib/catalog-snapshot.json");

const url = process.env.VITE_SUPABASE_URL;
const key = process.env.VITE_SUPABASE_PUBLISHABLE_KEY;

const empty = { products: [], settings: null, generatedAt: null };

if (!url || !key) {
  console.log("[snapshot] No Supabase credentials — skipping snapshot.");
  writeFileSync(OUT, JSON.stringify(empty));
  process.exit(0);
}

try {
  const sb = createClient(url, key);
  const [{ data: products, error: pe }, { data: settingsRows, error: se }] =
    await Promise.all([
      sb.from("products").select("*").order("id"),
      sb.from("settings").select("*").eq("id", 1),
    ]);

  if (pe || se) {
    console.warn("[snapshot] Fetch error:", pe || se);
    writeFileSync(OUT, JSON.stringify(empty));
    process.exit(0);
  }

  const snapshot = {
    products: products ?? [],
    settings: settingsRows?.[0]?.data ?? null,
    generatedAt: new Date().toISOString(),
  };

  writeFileSync(OUT, JSON.stringify(snapshot));
  console.log(`[snapshot] OK — ${products?.length ?? 0} products, settings: ${snapshot.settings ? "yes" : "no"}`);
} catch (err) {
  console.warn("[snapshot] Exception:", err.message);
  writeFileSync(OUT, JSON.stringify(empty));
}
