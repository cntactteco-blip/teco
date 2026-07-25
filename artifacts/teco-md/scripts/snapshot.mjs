/**
 * Generează src/lib/catalog-snapshot.json direct din Cloudflare D1 (teco-db).
 * Rulează la fiecare build Cloudflare (cf-build), înainte de vite build.
 * Migrat de la Supabase → D1 (site-ul rulează acum 100% pe Cloudflare).
 */
import { writeFileSync, mkdirSync } from "fs";
import { fileURLToPath } from "url";
import path from "path";
import { execFileSync } from "child_process";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.join(__dirname, "../src/lib/catalog-snapshot.json");
const IMG_DIR = path.join(__dirname, "../public/product-images");
const DB_NAME = "teco-db";

function d1Query(sql) {
  const raw = execFileSync(
    "npx",
    ["wrangler", "d1", "execute", DB_NAME, "--remote", "--json", "--command", sql],
    { encoding: "utf8", maxBuffer: 50 * 1024 * 1024 },
  );
  const parsed = JSON.parse(raw);
  return parsed[0]?.results ?? [];
}

function extractBase64Images(products) {
  mkdirSync(IMG_DIR, { recursive: true });
  let extracted = 0;
  for (const product of products) {
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
  const rawProducts = d1Query("SELECT * FROM products ORDER BY id");
  const prods = rawProducts.map((p) => ({
    ...p,
    images: typeof p.images === "string" ? JSON.parse(p.images || "[]") : (p.images ?? []),
    in_stock: p.in_stock === 1 || p.in_stock === true,
  }));

  const extracted = extractBase64Images(prods);

  const settingsRows = d1Query("SELECT data FROM settings WHERE id = 1");
  let settings = null;
  try {
    settings = settingsRows?.[0]?.data ? JSON.parse(settingsRows[0].data) : null;
  } catch {
    settings = null;
  }

  const snapshot = {
    products: prods,
    settings,
    generatedAt: new Date().toISOString(),
  };
  writeFileSync(OUT, JSON.stringify(snapshot));
  console.log(`[snapshot] OK — ${prods.length} produse din D1, ${extracted} imagini extrase, settings: ${settings ? "yes" : "no"}`);

  try {
    const sitemapScript = path.join(__dirname, "generate-sitemap.mjs");
    execFileSync(process.execPath, [sitemapScript], { stdio: "inherit" });
  } catch (sitemapErr) {
    console.warn("[sitemap] Eroare la generare sitemap:", sitemapErr.message);
  }
} catch (err) {
  console.warn("[snapshot] Exception — keeping existing snapshot:", err.message);
}
