/**
 * Generează src/lib/catalog-snapshot.json direct din Cloudflare D1 (teco-db).
 * Rulează la fiecare build Cloudflare (cf-build), înainte de vite build.
 * Migrat de la Supabase → D1 (site-ul rulează acum 100% pe Cloudflare).
 */
import { existsSync, readFileSync, writeFileSync, mkdirSync } from "fs";
import { fileURLToPath } from "url";
import path from "path";
import { execFileSync } from "child_process";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.join(__dirname, "../src/lib/catalog-snapshot.json");
const IMG_DIR = path.join(__dirname, "../public/product-images");
const DB_NAME = "teco-db";

function readExistingSnapshot() {
  if (!existsSync(OUT)) return null;
  try {
    const snapshot = JSON.parse(readFileSync(OUT, "utf8"));
    return Array.isArray(snapshot?.products) && snapshot.products.length > 0
      ? snapshot
      : null;
  } catch {
    return null;
  }
}

function d1Query(sql) {
  const raw = execFileSync(
    "npx",
    ["wrangler", "d1", "execute", DB_NAME, "--remote", "--json", "--command", sql],
    { encoding: "utf8", maxBuffer: 50 * 1024 * 1024 },
  );
  const parsed = JSON.parse(raw);
  return parsed[0]?.results ?? [];
}

async function readProducts() {
  try {
    const products = d1Query("SELECT * FROM products ORDER BY id");
    if (!Array.isArray(products) || products.length === 0) throw new Error("D1 returned no products");
    return { products, source: "D1" };
  } catch (error) {
    // Cloudflare Pages builds may not have credentials for the remote D1 CLI.
    // The public catalog API reads the same production database at request time.
    console.warn(`[snapshot] D1 CLI unavailable (${error.message}); reading the live catalog API.`);
    const response = await fetch("https://teco.md/api/products", { signal: AbortSignal.timeout(20000) });
    if (!response.ok) throw new Error(`Catalog API returned ${response.status}`);
    const payload = await response.json();
    if (!Array.isArray(payload?.data) || payload.data.length === 0 ||
        payload.data.some(product => !product.id || !product.name || !product.slug || !Number.isFinite(Number(product.price)))) {
      throw new Error("Catalog API returned an incomplete product list");
    }
    return { products: payload.data, source: "live API" };
  }
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
  const existingSnapshot = readExistingSnapshot();
  const { products: rawProducts, source } = await readProducts();
  const prods = rawProducts.map((p) => ({
    ...p,
    images: typeof p.images === "string" ? JSON.parse(p.images || "[]") : (p.images ?? []),
    in_stock: p.in_stock === 1 || p.in_stock === true,
  }));

  const extracted = extractBase64Images(prods);

  let settings = existingSnapshot?.settings ?? null;
  try {
    const settingsRows = d1Query("SELECT data FROM settings WHERE id = 1");
    settings = settingsRows?.[0]?.data ? JSON.parse(settingsRows[0].data) : null;
  } catch (error) {
    console.warn(`[snapshot] Settings D1 unavailable; retaining existing settings (${error.message}).`);
  }

  let blogPosts = existingSnapshot?.blogPosts ?? [];
  try {
    blogPosts = d1Query("SELECT * FROM blog_posts WHERE published = 1 ORDER BY published_at DESC");
  } catch (blogErr) {
    console.warn("[snapshot] Blog D1 CLI unavailable; reading the public blog API.", blogErr.message);
    try {
      const response = await fetch("https://teco.md/api/blog-posts", { signal: AbortSignal.timeout(20000) });
      if (!response.ok) throw new Error(`Blog API returned ${response.status}`);
      const payload = await response.json();
      if (!Array.isArray(payload?.data)) throw new Error("Invalid blog API response");
      blogPosts = payload.data.filter(post => post.published === true || post.published === 1);
    } catch (error) {
      console.warn("[snapshot] Blog API unavailable; retaining existing articles.", error.message);
    }
  }

  const snapshot = {
    products: prods,
    blogPosts,
    settings,
    generatedAt: new Date().toISOString(),
  };
  writeFileSync(OUT, JSON.stringify(snapshot));
  console.log(`[snapshot] OK — ${prods.length} products from ${source}, ${extracted} extracted images, settings: ${settings ? "yes" : "no"}`);

  // The final build generates sitemap.xml from the actual rendered routes.
} catch (err) {
  console.error("[snapshot] Build stopped: no current catalog is available.", err);
  process.exitCode = 1;
}
