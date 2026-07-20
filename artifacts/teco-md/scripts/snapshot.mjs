import { createClient } from "@supabase/supabase-js";
import { writeFileSync, mkdirSync } from "fs";
import { fileURLToPath } from "url";
import path from "path";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.join(__dirname, "../src/lib/catalog-snapshot.json");
const IMG_DIR = path.join(__dirname, "../public/product-images");

const url = process.env.VITE_SUPABASE_URL;
const key = process.env.VITE_SUPABASE_PUBLISHABLE_KEY;

if (!url || !key) {
  console.log("[snapshot] No Supabase credentials — keeping existing snapshot.");
  process.exit(0);
}

// ─── Extrage base64 → fișiere statice ──────────────────────────────
function extractBase64Images(products) {
  mkdirSync(IMG_DIR, { recursive: true });
  let extracted = 0;

  for (const product of products) {
    // imagine principală
    if (product.image_url?.startsWith("data:")) {
      const match = product.image_url.match(/^data:image\/(\w+);base64,(.+)$/);
      if (match) {
        const ext = match[1] === "jpeg" ? "jpg" : match[1];
        const fname = `${product.id}.${ext}`;
        writeFileSync(path.join(IMG_DIR, fname), Buffer.from(match[2], "base64"));
        product.image_url = `/product-images/${fname}`;
        extracted++;
      }
    }

    // galerie suplimentară
    if (Array.isArray(product.images)) {
      product.images = product.images.map((img, idx) => {
        if (typeof img === "string" && img.startsWith("data:")) {
          const match = img.match(/^data:image\/(\w+);base64,(.+)$/);
          if (match) {
            const ext = match[1] === "jpeg" ? "jpg" : match[1];
            const fname = `${product.id}-${idx}.${ext}`;
            writeFileSync(path.join(IMG_DIR, fname), Buffer.from(match[2], "base64"));
            extracted++;
            return `/product-images/${fname}`;
          }
        }
        return img;
      });
    }
  }

  return extracted;
}

try {
  const sb = createClient(url, key);
  const [{ data: products, error: pe }, { data: settingsRows, error: se }] =
    await Promise.all([
      sb.from("products").select("*").order("id"),
      sb.from("settings").select("*").eq("id", 1),
    ]);

  if (pe || se) {
    console.warn("[snapshot] Fetch error — keeping existing snapshot:", pe || se);
    process.exit(0);
  }

  const prods = products ?? [];

  // Extrage imaginile base64 în fișiere statice
  const extracted = extractBase64Images(prods);

  const snapshot = {
    products: prods,
    settings: settingsRows?.[0]?.data ?? null,
    generatedAt: new Date().toISOString(),
  };

  writeFileSync(OUT, JSON.stringify(snapshot));
  console.log(`[snapshot] OK — ${prods.length} produse, ${extracted} imagini extrase, settings: ${snapshot.settings ? "yes" : "no"}`);
} catch (err) {
  console.warn("[snapshot] Exception — keeping existing snapshot:", err.message);
}
