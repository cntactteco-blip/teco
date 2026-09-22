import { canonicalPath } from "../lib/seo-url.ts";

export type Manifest = { pages: Record<string, string>; redirects: Record<string, string>; queryRedirects?: Record<string, string> };
type Environment = { ASSETS: { fetch(request: Request): Promise<Response> }; DB?: D1Database };
const privatePaths = new Set(["/admin/", "/checkout/", "/favorit/"]);
const escapeHtml = (value: unknown) => String(value ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]!));

export async function serveHtml(request: Request, env: Environment, manifest: Manifest): Promise<Response> {
  const url = new URL(request.url);
  const path = url.pathname.replace(/\/+$/, "") || "/";
  if (!['GET', 'HEAD'].includes(request.method)) return new Response("Method not allowed", { status: 405, headers: { Allow: "GET, HEAD" } });
  // Resources and internal assets retain their own MIME type and status.
  if (/\.(?:js|css|json|xml|txt|png|jpe?g|webp|svg|ico|woff2?|pdf)$/i.test(path) || path.startsWith("/__seo/")) {
    return env.ASSETS.fetch(request);
  }
  const key = canonicalPath(url.href);
  const legacy = manifest.redirects[path];
  const alias = legacy ? (manifest.queryRedirects?.[canonicalPath(legacy)] || legacy) : manifest.queryRedirects?.[key];
  if (alias) {
    const target = new URL(alias, url.origin);
    for (const [key, value] of url.searchParams) if (key !== "cat" && !target.searchParams.has(key)) target.searchParams.append(key, value);
    if (target.href !== url.href) return new Response(null, { status: 301, headers: { Location: target.pathname + target.search } });
  }
  const asset = manifest.pages[key];
  const isPrivate = privatePaths.has(key);
  if ((asset || isPrivate) && url.pathname !== new URL(key, url).pathname) {
    url.pathname = new URL(key, url).pathname;
    return new Response(null, { status: 301, headers: { Location: url.pathname + url.search } });
  }
  const readAsset = async (pathname: string) => {
    const assetUrl = new URL(pathname, url.origin);
    return env.ASSETS.fetch(new Request(assetUrl, { method: "GET" }));
  };
  const response = async (pathname: string, status: number, noIndex = false) => {
    const original = await readAsset(pathname);
    if (!original.ok && status === 200) return new Response("Pagina nu este disponibilă temporar.", { status: 503, headers: { "Retry-After": "60", "Cache-Control": "no-store" } });
    const headers = new Headers(original.headers);
    headers.set("Content-Type", "text/html; charset=utf-8");
    headers.set("Cache-Control", "public, max-age=0, must-revalidate");
    if (noIndex) headers.set("X-Robots-Tag", "noindex, follow");
    return new Response(request.method === "HEAD" ? null : original.body, { status, headers });
  };
  if (asset) return response(asset, 200, url.searchParams.has("q"));
  if (isPrivate) return response("/app", 200, true);

  // Products/articles created after the last build remain reachable. Missing
  // records are a real 404; database failures are temporary, never false 404s.
  const dynamic = path.match(/^\/(product|blog)\/([^/]+)$/);
  if (dynamic && env.DB) {
    try {
      const slug = decodeURIComponent(dynamic[2]);
      const row = dynamic[1] === "product"
        ? await env.DB.prepare("SELECT * FROM products WHERE slug = ? OR CAST(id AS TEXT) = ? LIMIT 1").bind(slug, slug).first<Record<string, unknown>>()
        : await env.DB.prepare("SELECT * FROM blog_posts WHERE slug = ? AND published = 1 LIMIT 1").bind(slug).first<Record<string, unknown>>();
      if (row) {
        const canonical = canonicalPath(`/${dynamic[1]}/${encodeURIComponent(String(row.slug || row.id))}`);
        if (url.pathname !== canonical) return new Response(null, { status: 301, headers: { Location: canonical + url.search } });
        const title = escapeHtml(row.name || row.title);
        const description = escapeHtml(row.description || "");
        const shell = await readAsset("/app");
        if (!shell.ok) throw new Error("Missing application shell");
        let html = await shell.text();
        html = html.replace(/<meta[^>]*name="robots"[^>]*>/gi, "");
        html = html.replace("</head>", `<title data-teco-prerender="">${title} | TECO.md</title><meta data-teco-prerender="" name="description" content="${description.slice(0, 300)}"><link data-teco-prerender="" rel="canonical" href="https://teco.md${escapeHtml(canonical)}"></head>`);
        html = html.replace('<div id="root"></div>', `<div id="root"><main><h1>${title}</h1><p>${description}</p><a href="/produse/">Catalog TECO.md</a></main></div>`);
        return new Response(request.method === "HEAD" ? null : html, { headers: { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-cache" } });
      }
    } catch {
      return new Response("Pagina nu este disponibilă temporar.", { status: 503, headers: { "Retry-After": "60", "Cache-Control": "no-store" } });
    }
  }
  return response("/404", 404, true);
}
