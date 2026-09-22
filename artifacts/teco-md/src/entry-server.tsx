import { PassThrough } from "node:stream";
import { renderToPipeableStream } from "react-dom/server";
import type { HelmetServerState } from "react-helmet-async";
import App from "./App";
import { getState } from "./lib/store";
import { canonicalPath } from "./lib/seo-url";
import { CITY_DATA } from "./pages/ServiceCity";
import { resolveCategorySlug } from "./lib/category-routing";

export { canonicalPath } from "./lib/seo-url";
export { getState } from "./lib/store";

export function getCategoryRedirects(): Record<string, string> {
  const state = getState();
  const categories = [...new Set(state.products.map(product => product.category))];
  const kitCategory = resolveCategorySlug("kituri", state.settings.categories, categories);
  const requested = new Set([...categories, "kituri", "alarme", ...state.settings.categories.flatMap(category => [category.id, category.slug])]);
  const redirects: Record<string, string> = {};
  for (const category of requested) {
    const resolved = resolveCategorySlug(category, state.settings.categories, categories);
    if (!categories.includes(resolved)) continue;
    const from = canonicalPath(`/produse?cat=${encodeURIComponent(category)}`);
    const to = resolved === kitCategory ? "/seturi-camere-supraveghere/" : canonicalPath(`/produse?cat=${encodeURIComponent(resolved)}`);
    if (from !== to) redirects[from] = to;
  }
  return redirects;
}

export function getPrerenderRoutes() {
  const state = getState();
  const paths = ["/", "/produse", "/seturi-camere-supraveghere", "/servicii", "/montare-camere-supraveghere", "/camere-supraveghere-chisinau", "/sisteme-supraveghere-casa", "/camere-supraveghere-exterior", "/camere-supraveghere-moldova", "/reparatii-camere-supraveghere", "/contact", "/b2b", "/oferta", "/blog", "/termeni", "/confidentialitate", "/garantii", "/livrare"];
  paths.push(...Object.keys(CITY_DATA).map(city => `/servicii/${city}`));
  paths.push(...state.products.map(product => `/product/${encodeURIComponent(product.slug || product.id)}`));
  paths.push(...[...new Set(state.products.map(product => product.category))].map(category => `/produse?cat=${encodeURIComponent(category)}`));
  paths.push(...state.blogPosts.filter(post => post.published).map(post => `/blog/${post.slug}`));
  const aliases = getCategoryRedirects();
  return [...new Set(paths.map(canonicalPath))].filter(path => !aliases[path]);
}

/** Render the same components visitors use, including lazy service pages. */
export async function render(url: string): Promise<{ body: string; head: string }> {
  const helmetContext: { helmet?: HelmetServerState } = {};
  const parsed = new URL(url, "https://teco.md");
  const ssrPath = (parsed.pathname.replace(/\/$/, "") || "/") + parsed.search;
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    const output = new PassThrough();
    let failure: unknown;
    const timer = setTimeout(() => { stream.abort(); reject(new Error(`Rendering timed out: ${url}`)); }, 15000);
    output.on("data", chunk => chunks.push(Buffer.from(chunk)));
    output.on("error", reject);
    output.on("end", () => {
      clearTimeout(timer);
      if (failure) { reject(failure); return; }
      const helmet = helmetContext.helmet;
      const html = Buffer.concat(chunks).toString("utf8");
      const body = html.match(/<body[^>]*>([\s\S]*)<\/body>/)?.[1];
      const head = helmet
        ? [helmet.title, helmet.meta, helmet.link, helmet.script].map(part => part.toString()).join("\n")
        : html.match(/<head[^>]*>([\s\S]*?)<\/head>/)?.[1];
      if (!head || body === undefined) { reject(new Error(`Missing document metadata: ${url}`)); return; }
      resolve({ body, head });
    });
    const stream = renderToPipeableStream(<html lang="ro"><head /><body><App ssrPath={ssrPath} helmetContext={helmetContext} /></body></html>, {
      onAllReady() { stream.pipe(output); },
      onShellError(error) { clearTimeout(timer); reject(error); },
      onError(error) { failure = error; },
    });
  });
}
