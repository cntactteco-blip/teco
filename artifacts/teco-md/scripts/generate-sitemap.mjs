/** Generate the sitemap from the same route list used for rendered HTML. */
import { writeFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { createServer } from "vite";
import { isIndexableHead, makeSitemap } from "./seo-output.mjs";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const vite = await createServer({ configFile: resolve(root, "vite.config.cloudflare.ts"), server: { middlewareMode: true }, appType: "custom", mode: "production" });
try {
  const { getPrerenderRoutes, render } = await vite.ssrLoadModule("/src/entry-server.tsx");
  const routes = [];
  for (const route of getPrerenderRoutes()) {
    if (isIndexableHead((await render(route)).head)) routes.push(route);
  }
  writeFileSync(resolve(root, "public/sitemap.xml"), makeSitemap(routes));
  console.log(`[sitemap] ${routes.length} canonical URLs`);
} finally {
  await vite.close();
}
