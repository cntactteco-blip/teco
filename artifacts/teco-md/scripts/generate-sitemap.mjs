/**
 * Generează public/sitemap.xml dinamic din catalog-snapshot.json
 * Rulează automat după snapshot.mjs la fiecare build Cloudflare.
 * Poate fi rulat și manual: node scripts/generate-sitemap.mjs
 */
import { readFileSync, writeFileSync } from "fs";
import { fileURLToPath } from "url";
import path from "path";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SNAPSHOT = path.join(__dirname, "../src/lib/catalog-snapshot.json");
const OUT      = path.join(__dirname, "../public/sitemap.xml");
const BASE     = "https://teco.md";

const CAT_META = {
  wifi:   { label: "Camere WiFi",            priority: "0.85", freq: "daily" },
  poe:    { label: "Camere PoE",             priority: "0.85", freq: "daily" },
  "4g":   { label: "Camere 4G Solar",        priority: "0.80", freq: "weekly" },
  nvr:    { label: "Înregistratoare NVR",    priority: "0.80", freq: "weekly" },
  kituri: { label: "Kituri Complete",         priority: "0.90", freq: "daily" },
  alarme: { label: "Sisteme Alarmă",          priority: "0.80", freq: "weekly" },
};

function esc(s) {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

let snapshot;
try {
  snapshot = JSON.parse(readFileSync(SNAPSHOT, "utf8"));
} catch {
  console.warn("[sitemap] Nu am putut citi snapshot-ul, sitemap-ul NU a fost regenerat.");
  process.exit(0);
}

const products  = snapshot.products ?? [];
const today     = new Date().toISOString().slice(0, 10);
const snapshotDate = (snapshot.generatedAt ?? today).slice(0, 10);

const urls = [];

/* ── 1. Homepage ─────────────────────────────────── */
urls.push(`
  <url>
    <loc>${BASE}/</loc>
    <xhtml:link rel="alternate" hreflang="ro" href="${BASE}/"/>
    <xhtml:link rel="alternate" hreflang="ru" href="${BASE}/"/>
    <xhtml:link rel="alternate" hreflang="x-default" href="${BASE}/"/>
    <lastmod>${today}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>1.0</priority>
    <image:image>
      <image:loc>${BASE}/opengraph.jpg</image:loc>
      <image:title>Teco.md — Sisteme de Supraveghere Moldova</image:title>
    </image:image>
  </url>`);

/* ── 2. Catalog principal ────────────────────────── */
urls.push(`
  <url>
    <loc>${BASE}/produse</loc>
    <xhtml:link rel="alternate" hreflang="ro" href="${BASE}/produse"/>
    <xhtml:link rel="alternate" hreflang="ru" href="${BASE}/produse"/>
    <xhtml:link rel="alternate" hreflang="x-default" href="${BASE}/produse"/>
    <lastmod>${snapshotDate}</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.95</priority>
  </url>`);

/* ── 3. Pagini pe categorii ──────────────────────── */
for (const [slug, meta] of Object.entries(CAT_META)) {
  const count = products.filter(p => p.category === slug).length;
  if (count === 0) continue;
  urls.push(`
  <url>
    <loc>${BASE}/produse?cat=${slug}</loc>
    <xhtml:link rel="alternate" hreflang="ro" href="${BASE}/produse?cat=${slug}"/>
    <xhtml:link rel="alternate" hreflang="ru" href="${BASE}/produse?cat=${slug}"/>
    <lastmod>${snapshotDate}</lastmod>
    <changefreq>${meta.freq}</changefreq>
    <priority>${meta.priority}</priority>
  </url>`);
}

/* ── 4. Seturi camere supraveghere (alias kituri) ── */
urls.push(`
  <url>
    <loc>${BASE}/seturi-camere-supraveghere</loc>
    <lastmod>${snapshotDate}</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.90</priority>
  </url>`);

/* ── 5. Servicii ─────────────────────────────────── */
urls.push(`
  <url>
    <loc>${BASE}/servicii</loc>
    <xhtml:link rel="alternate" hreflang="ro" href="${BASE}/servicii"/>
    <xhtml:link rel="alternate" hreflang="ru" href="${BASE}/servicii"/>
    <xhtml:link rel="alternate" hreflang="x-default" href="${BASE}/servicii"/>
    <lastmod>${today}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.75</priority>
  </url>`);

/* ── 6. Blog ─────────────────────────────────────── */
urls.push(`
  <url>
    <loc>${BASE}/blog</loc>
    <xhtml:link rel="alternate" hreflang="ro" href="${BASE}/blog"/>
    <xhtml:link rel="alternate" hreflang="ru" href="${BASE}/blog"/>
    <xhtml:link rel="alternate" hreflang="x-default" href="${BASE}/blog"/>
    <lastmod>${today}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.65</priority>
  </url>`);

/* ── 7. Produse individuale ──────────────────────── */
for (const p of products) {
  const imgUrl = p.image_url ?? p.imageUrl ?? "";
  const absImg = imgUrl.startsWith("http") ? imgUrl : `${BASE}${imgUrl}`;
  const name   = esc(p.name ?? "");
  const priceStr = p.price ? ` — ${p.price.toLocaleString("ro")} MDL` : "";
  // kituri au prioritate mai mare (înaltă intenție de cumpărare)
  const priority = p.category === "kituri" ? "0.85" : "0.80";

  urls.push(`
  <url>
    <loc>${BASE}/product/${p.id}</loc>
    <lastmod>${snapshotDate}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>${priority}</priority>${imgUrl ? `
    <image:image>
      <image:loc>${esc(absImg)}</image:loc>
      <image:title>${name}${esc(priceStr)}</image:title>
    </image:image>` : ""}
  </url>`);
}

const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:xhtml="http://www.w3.org/1999/xhtml"
        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
${urls.join("\n")}
</urlset>
`;

writeFileSync(OUT, xml);
console.log(`[sitemap] OK — ${products.length} produse, ${Object.keys(CAT_META).length} categorii → ${OUT}`);
