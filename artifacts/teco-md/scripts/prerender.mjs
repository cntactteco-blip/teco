import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { createServer } from "vite";
import { documentHtml, isIndexableHead, legacyRedirects, makeSitemap } from "./seo-output.mjs";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const out = resolve(root, "dist/public");
const template = readFileSync(resolve(out, "index.html"), "utf8");
const vite = await createServer({ configFile: resolve(root, "vite.config.cloudflare.ts"), server: { middlewareMode: true }, appType: "custom", mode: "production" });
try {
  const { render, getPrerenderRoutes, getState, getCategoryRedirects } = await vite.ssrLoadModule("/src/entry-server.tsx");
  const routes = getPrerenderRoutes();
  const pages = {};
  const indexableRoutes = [];
  for (const [index, route] of routes.entries()) {
    const rendered = await render(route);
    if (!/<h1\b/i.test(rendered.body) || !/<a\b/i.test(rendered.body)) throw new Error(`Missing content or links: ${route}`);
    if (isIndexableHead(rendered.head)) {
      if (!rendered.head.includes(`href="https://teco.md${escapeCanonical(route)}"`)) throw new Error(`Missing matching canonical: ${route}`);
      indexableRoutes.push(route);
    }
    const asset = `/__seo/page-${index}/`;
    const folder = resolve(out, asset.slice(1));
    mkdirSync(folder, { recursive: true });
    writeFileSync(resolve(folder, "index.html"), documentHtml(template, rendered));
    pages[route] = asset;
  }
  const missing = documentHtml(template, await render("/__page_not_found__"));
  writeFileSync(resolve(out, "404.html"), missing);
  writeFileSync(resolve(out, "app.html"), documentHtml(template, { head: '<meta name="robots" content="noindex, follow">', body: "" }));
  writeFileSync(resolve(out, "sitemap.xml"), makeSitemap(indexableRoutes));
  const manifest = { pages, redirects: legacyRedirects(getState().products), queryRedirects: getCategoryRedirects() };
  mkdirSync(resolve(root, "src/generated"), { recursive: true });
  writeFileSync(resolve(root, "src/generated/seo-manifest.json"), JSON.stringify(manifest));
  writeFileSync(resolve(out, "_redirects"), "# Page redirects are handled by the HTML Pages Function.\n");
  writeFileSync(resolve(out, "_routes.json"), JSON.stringify({ version: 1, include: ["/*"], exclude: ["/assets/*", "/product-images/*", "/__seo/*", "/favicon*", "/apple-touch-icon*", "/opengraph.jpg", "/logo*", "/manifest*", "/robots.txt", "/sitemap.xml"] }));
  console.log(`[prerender] ${routes.length} pages; ${Object.keys(manifest.redirects).length} exact redirects; ${indexableRoutes.length} sitemap URLs.`);
} finally {
  await vite.close();
}

function escapeCanonical(route) {
  return route.replace(/&/g, "&amp;").replace(/"/g, "&quot;");
}
