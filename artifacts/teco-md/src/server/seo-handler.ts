import { absoluteImage, canonicalPath } from "../lib/seo-url.ts";
import { resolveCategorySlug } from "../lib/category-routing.ts";
import { currentProductDescription, productSeoTitle, productSeoDescription, seoSnippet } from "../lib/product-copy.ts";

export type Manifest = { pages: Record<string, string>; redirects: Record<string, string>; queryRedirects?: Record<string, string> };
type Environment = { ASSETS: { fetch(request: Request): Promise<Response> }; DB?: D1Database };
const privatePaths = new Set(["/admin/", "/checkout/", "/favorit/"]);
const escapeHtml = (value: unknown) => String(value ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]!));
const readableText = (value: unknown) => String(value ?? "").replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
const sitemapXml = (routes: string[]) => `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${[...new Set(routes)].sort().map((route) => `  <url><loc>${escapeHtml(`https://teco.md${route}`)}</loc></url>`).join("\n")}\n</urlset>\n`;
type RuntimeCategory = { id?: string; slug: string; label: string; seoTitle?: string; seoDescription?: string; seoIntro?: string };
async function categoriesFromDb(db: D1Database): Promise<RuntimeCategory[]> {
  const row = await db.prepare("SELECT data FROM settings WHERE id = 1").first<{ data: string }>();
  if (!row?.data) return [];
  const parsed = JSON.parse(row.data);
  return Array.isArray(parsed?.categories) ? parsed.categories.filter((category: RuntimeCategory) => category && typeof category.slug === "string" && typeof category.label === "string") : [];
}

export async function serveHtml(request: Request, env: Environment, manifest: Manifest): Promise<Response> {
  const url = new URL(request.url);
  const path = url.pathname.replace(/\/+$/, "") || "/";
  if (!['GET', 'HEAD'].includes(request.method)) return new Response("Method not allowed", { status: 405, headers: { Allow: "GET, HEAD" } });
  if (path === "/sitemap.xml") {
    const base = await env.ASSETS.fetch(new Request(new URL("/sitemap.xml", url.origin)));
    if (!base.ok || !env.DB) return base;
    try {
      const xml = await base.text();
      const staticRoutes = [...xml.matchAll(/<loc>(https:\/\/teco\.md[^<]*)<\/loc>/g)]
        .map(([, location]) => location.replace(/&amp;/g, "&").replace("https://teco.md", ""))
        .filter((route) => !route.startsWith("/product/") && !route.startsWith("/blog/") || route === "/blog/");
      const [products, articles, categories] = await Promise.all([
        env.DB.prepare("SELECT slug, category FROM products WHERE slug IS NOT NULL AND slug != '' AND price > 0").all<{ slug: string; category: string }>(),
        env.DB.prepare("SELECT slug FROM blog_posts WHERE slug IS NOT NULL AND slug != '' AND published = 1").all<{ slug: string }>(),
        categoriesFromDb(env.DB),
      ]);
      const activeCategories = new Set((products.results ?? []).map((row) => row.category));
      const productCategories = [...activeCategories];
      const kitCategory = resolveCategorySlug("kituri", categories, productCategories);
      const categorySlugs = categories.map((category) => resolveCategorySlug(category.slug, categories, productCategories));
      const routes = [
        ...staticRoutes.filter((route) => !route.startsWith("/produse/?cat=") || !categories.length),
        ...categorySlugs.filter((slug) => activeCategories.has(slug) && slug !== kitCategory)
          .map((slug) => canonicalPath(`/produse?cat=${encodeURIComponent(slug)}`)),
        ...(products.results ?? []).map((row) => `/product/${encodeURIComponent(row.slug)}/`),
        ...(articles.results ?? []).map((row) => `/blog/${encodeURIComponent(row.slug)}/`),
      ];
      const sitemap = sitemapXml(routes);
      return new Response(request.method === "HEAD" ? null : sitemap, { headers: { "Content-Type": "application/xml; charset=utf-8", "Cache-Control": "public, max-age=300" } });
    } catch {
      return env.ASSETS.fetch(new Request(new URL("/sitemap.xml", url.origin), { method: request.method }));
    }
  }
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
  const dynamicPage = async (title: string, description: string, canonical: string, body: string, schema: unknown) => {
    const shell = await readAsset("/app");
    if (!shell.ok) throw new Error("Missing application shell");
    let html = await shell.text();
    html = html.replace(/<meta[^>]*name="robots"[^>]*>/gi, "");
    const safeTitle = escapeHtml(seoSnippet(title, 62));
    const safeDescription = escapeHtml(seoSnippet(description, 155));
    const safeCanonical = escapeHtml(`https://teco.md${canonical}`);
    const jsonLd = JSON.stringify(schema).replace(/</g, "\\u003c");
    html = html.replace("</head>", `<title data-teco-prerender="">${safeTitle}</title><meta data-teco-prerender="" name="description" content="${safeDescription}"><link data-teco-prerender="" rel="canonical" href="${safeCanonical}"><meta property="og:type" content="website"><meta property="og:title" content="${safeTitle}"><meta property="og:description" content="${safeDescription}"><meta property="og:url" content="${safeCanonical}"><meta property="og:image" content="https://teco.md/opengraph.jpg"><meta name="twitter:card" content="summary_large_image"><meta name="twitter:title" content="${safeTitle}"><meta name="twitter:description" content="${safeDescription}"><meta name="twitter:image" content="https://teco.md/opengraph.jpg"><script type="application/ld+json">${jsonLd}</script></head>`);
    html = html.replace('<div id="root"></div>', `<div id="root"><main>${body}</main></div>`);
    return new Response(request.method === "HEAD" ? null : html, { headers: { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "public, max-age=0, must-revalidate" } });
  };
  // Categories created in Admin need a crawlable page on the same day, without a build.
  if (path === "/produse" && url.searchParams.has("cat") && env.DB) {
    try {
      const slug = url.searchParams.get("cat") || "";
      const categories = await categoriesFromDb(env.DB);
      const category = categories.find((item) => item.slug === slug || item.id === slug);
      if (category && (!asset || category.seoTitle || category.seoDescription || category.seoIntro)) {
        const products = await env.DB.prepare("SELECT slug, name, price, category FROM products WHERE (category = ? OR category = ?) AND slug IS NOT NULL AND slug != '' AND price > 0 ORDER BY name LIMIT 100").bind(category.slug, category.id || category.slug).all<{ slug: string; name: string; price: number; category: string }>();
        if (!products.results?.length) return response("/404", 404, true);
        const resolvedSlug = resolveCategorySlug(slug, categories, products.results.map((product) => product.category));
        const canonical = canonicalPath(`/produse?cat=${encodeURIComponent(resolvedSlug)}`);
        const title = category.seoTitle || `${category.label} | Produse și prețuri în Moldova | Teco.md`;
        const description = category.seoDescription || `Compară ${category.label} la Teco.md. Vezi specificațiile și prețurile produselor și cere o recomandare sau montaj în Moldova.`;
        const intro = category.seoIntro || `Compară specificațiile produselor din categoria ${category.label} și alege echipamentul potrivit pentru obiectul tău.`;
        const links = products.results.map((product) => `<li><a href="/product/${encodeURIComponent(product.slug)}/">${escapeHtml(product.name)}</a> — ${escapeHtml(product.price)} MDL</li>`).join("");
        const body = `<h1>${escapeHtml(category.label)}</h1><p>${escapeHtml(intro)}</p><ul>${links}</ul><a href="/servicii/">Servicii de instalare</a>`;
        return dynamicPage(title, description, canonical, body, { "@context": "https://schema.org", "@type": "CollectionPage", name: category.label, description, url: `https://teco.md${canonical}` });
      }
    } catch {
      if (!asset) return new Response("Pagina nu este disponibilă temporar.", { status: 503, headers: { "Retry-After": "60", "Cache-Control": "no-store" } });
    }
  }
  if (path === "/blog" && env.DB) {
    try {
      const articles = await env.DB.prepare("SELECT slug, title, description FROM blog_posts WHERE published = 1 AND slug IS NOT NULL AND slug != '' ORDER BY published_at DESC LIMIT 100").all<{ slug: string; title: string; description: string }>();
      const body = `<h1>Ghiduri despre supraveghere și securitate</h1><p>Articole despre alegerea camerelor, sistemelor de alarmă și instalarea lor în Moldova.</p><ul>${(articles.results ?? []).map((article) => `<li><a href="/blog/${encodeURIComponent(article.slug)}/">${escapeHtml(article.title)}</a> — ${escapeHtml(seoSnippet(article.description, 180))}</li>`).join("")}</ul><a href="/produse/">Vezi produsele</a>`;
      return dynamicPage("Ghiduri despre camere și alarme | Teco.md", "Ghiduri practice despre camere de supraveghere, sisteme de alarmă și montaj în Moldova. Descoperă cele mai recente articole Teco.md.", "/blog/", body, { "@context": "https://schema.org", "@type": "CollectionPage", name: "Ghiduri despre supraveghere și securitate", url: "https://teco.md/blog/" });
    } catch { /* The static blog remains available if the database is temporarily unavailable. */ }
  }
  // Prices, article edits and publication status can change between builds.
  if (asset && !path.startsWith("/product/") && !path.startsWith("/blog/")) return response(asset, 200, url.searchParams.has("q"));
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
        const rawDescription = currentProductDescription(row.description || row.long_description ||
          `${row.name || row.title} ${row.brand || ""} ${row.model || ""}. Vezi detaliile și disponibilitatea la TECO.md.`, row.price).trim();
        const description = escapeHtml(readableText(rawDescription));
        const longDescription = readableText(row.long_description);
        const specs = readableText(row.specs);
        const titleMeta = escapeHtml(dynamic[1] === "product" ? productSeoTitle(row.name) : seoSnippet(row.meta_title || `${row.title} | TECO.md`, 62));
        const descriptionMeta = escapeHtml(dynamic[1] === "product"
          ? productSeoDescription(rawDescription, row.name, row.price)
          : seoSnippet(row.meta_description || rawDescription, 155));
        const productImage = String(row.image_url || "").trim();
        const imageUrl = escapeHtml(productImage && !productImage.startsWith("data:")
          ? absoluteImage(productImage)
          : absoluteImage("/opengraph.jpg"));
        const socialHead = `<meta property="og:type" content="${dynamic[1] === "product" ? "product" : "article"}"><meta property="og:title" content="${titleMeta}"><meta property="og:description" content="${descriptionMeta}"><meta property="og:url" content="https://teco.md${escapeHtml(canonical)}"><meta property="og:image" content="${imageUrl}"><meta property="og:image:alt" content="${title}"><meta name="twitter:card" content="summary_large_image"><meta name="twitter:title" content="${titleMeta}"><meta name="twitter:description" content="${descriptionMeta}"><meta name="twitter:image" content="${imageUrl}">`;
        const price = Number(row.price);
        const productSchema = dynamic[1] === "product" && Number.isFinite(price) && price > 0
          ? `<script type="application/ld+json">${JSON.stringify({
              "@context": "https://schema.org", "@type": "Product",
              name: String(row.name || row.title),
              description: rawDescription.slice(0, 5000),
              ...(productImage && !productImage.startsWith("data:") ? { image: [absoluteImage(productImage)] } : {}),
              ...(row.brand ? { brand: { "@type": "Brand", name: String(row.brand) } } : {}),
              ...(row.model ? { model: String(row.model) } : {}),
              offers: { "@type": "Offer", url: `https://teco.md${canonical}`,
                priceCurrency: "MDL", price, availability: row.in_stock === 1 || row.in_stock === true
                  ? "https://schema.org/InStock" : "https://schema.org/OutOfStock" },
            }).replace(/</g, "\\u003c")}</script>`
          : "";
        const articleSchema = dynamic[1] === "blog"
          ? `<script type="application/ld+json">${JSON.stringify({
              "@context": "https://schema.org", "@type": "BlogPosting", headline: String(row.title),
              description: rawDescription, image: [absoluteImage(productImage && !productImage.startsWith("data:") ? productImage : "/opengraph.jpg")],
              url: `https://teco.md${canonical}`, datePublished: row.published_at, dateModified: row.updated_at || row.published_at,
              author: { "@type": "Organization", name: "TECO.md", url: "https://teco.md/" },
              publisher: { "@type": "Organization", name: "TECO.md", logo: { "@type": "ImageObject", url: "https://teco.md/logo.png" } },
            }).replace(/</g, "\\u003c")}</script>`
          : "";
        const shell = await readAsset("/app");
        if (!shell.ok) throw new Error("Missing application shell");
        let html = await shell.text();
        html = html.replace(/<meta[^>]*name="robots"[^>]*>/gi, "");
        html = html.replace("</head>", `<title data-teco-prerender="">${titleMeta}</title><meta data-teco-prerender="" name="description" content="${descriptionMeta}"><link data-teco-prerender="" rel="canonical" href="https://teco.md${escapeHtml(canonical)}">${socialHead}${productSchema}${articleSchema}</head>`);
        const productDetails = dynamic[1] === "product"
          ? `<img src="${imageUrl}" alt="${title}" width="600" height="600"><p>Preț: ${Number.isFinite(price) && price > 0 ? `${escapeHtml(price)} MDL` : "la cerere"}</p><p>${row.in_stock === 1 || row.in_stock === true ? "În stoc" : "Verifică disponibilitatea"}</p>`
          : "";
        const extraCopy = dynamic[1] === "product"
          ? `${longDescription && longDescription !== readableText(rawDescription) ? `<section><h2>Descriere detaliată</h2><p>${escapeHtml(longDescription)}</p></section>` : ""}${specs ? `<section><h2>Caracteristici</h2><p>${escapeHtml(specs)}</p></section>` : ""}`
          : "";
        const articleCopy = dynamic[1] === "blog" ? String(row.content ?? "").split(/\n+/).map((line) => line.trim()).filter(Boolean).slice(0, 120).map((line) => {
          if (line.startsWith("## ")) return `<h2>${escapeHtml(line.slice(3))}</h2>`;
          if (line.startsWith("### ")) return `<h3>${escapeHtml(line.slice(4))}</h3>`;
          return `<p>${escapeHtml(line.replace(/^[-*] /, ""))}</p>`;
        }).join("") : "";
        html = html.replace('<div id="root"></div>', `<div id="root"><main><h1>${title}</h1>${productDetails}<p>${description}</p>${extraCopy}${articleCopy}<a href="${dynamic[1] === "blog" ? "/blog/" : "/produse/"}">${dynamic[1] === "blog" ? "Articole TECO.md" : "Catalog TECO.md"}</a></main></div>`);
        return new Response(request.method === "HEAD" ? null : html, { headers: { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-cache" } });
      }
      return response("/404", 404, true);
    } catch {
      return new Response("Pagina nu este disponibilă temporar.", { status: 503, headers: { "Retry-After": "60", "Cache-Control": "no-store" } });
    }
  }
  if (asset) return response(asset, 200, url.searchParams.has("q"));
  return response("/404", 404, true);
}
