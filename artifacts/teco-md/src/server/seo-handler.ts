import { CATEGORY_GUIDES, categoryIntent, categorySeo, isSurveillanceKit } from "../lib/category-seo.ts";
import { productSchema as buildProductSchema } from "../lib/product-schema.ts";
import { productSpecRows } from "../lib/product-specs.ts";
import { absoluteImage, canonicalPath } from "../lib/seo-url.ts";
import { resolveCategorySlug } from "../lib/category-routing.ts";
import { renderArticleHtml } from "../lib/article-html.ts";
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
  const runtimeRedirects: Record<string, string> = {
    "/nvr": "/nvr-moldova/",
    "/nvr-xvr-registratoare": "/nvr-moldova/",
    "/router-4g-internet-rapid-fara-fir-oriunde-te-afli": "/router-4g-moldova/",
    "/cudy": "/router-4g-moldova/",
    "/internet-utp-ftp": "/cablu-utp-ftp-moldova/",
    "/interfoane-sisteme-de-control-i-management-al-accesului": "/interfoane-moldova/",
  };
  const runtimeTarget = runtimeRedirects[path];
  if (runtimeTarget) return new Response(null, { status: 301, headers: { Location: runtimeTarget } });
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
  const dynamicPage = async (title: string, description: string, canonical: string, body: string, schema: unknown, noIndex = false) => {
    const shell = await readAsset("/app");
    if (!shell.ok) throw new Error("Missing application shell");
    let html = await shell.text();
    html = html.replace(/<meta[^>]*name="robots"[^>]*>/gi, "");
    const safeTitle = escapeHtml(seoSnippet(title, 80));
    const safeDescription = escapeHtml(seoSnippet(description, 155));
    const safeCanonical = escapeHtml(`https://teco.md${canonical}`);
    const jsonLd = JSON.stringify(schema).replace(/</g, "\\u003c");
    html = html.replace("</head>", `<title data-teco-prerender="">${safeTitle}</title><meta data-teco-prerender="" name="description" content="${safeDescription}"><link data-teco-prerender="" rel="canonical" href="${safeCanonical}"><meta property="og:type" content="website"><meta property="og:title" content="${safeTitle}"><meta property="og:description" content="${safeDescription}"><meta property="og:url" content="${safeCanonical}"><meta property="og:image" content="https://teco.md/opengraph.jpg"><meta name="twitter:card" content="summary_large_image"><meta name="twitter:title" content="${safeTitle}"><meta name="twitter:description" content="${safeDescription}"><meta name="twitter:image" content="https://teco.md/opengraph.jpg"><script type="application/ld+json">${jsonLd}</script></head>`);
    if (noIndex) html = html.replace("</head>", '<meta name="robots" content="noindex, follow"></head>');
    html = html.replace('<div id="root"></div>', `<div id="root"><main>${body}</main></div>`);
    return new Response(request.method === "HEAD" ? null : html, { headers: { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "public, max-age=0, must-revalidate", ...(noIndex ? { "X-Robots-Tag": "noindex, follow" } : {}) } });
  };
  // Catalogs always read current D1 rows. A static build cannot freeze product counts or prices.
  if ((path === "/produse" || path === "/seturi-camere-supraveghere") && env.DB) {
    try {
      const requested = path === "/seturi-camere-supraveghere" ? "kituri" : url.searchParams.get("cat") || "all";
      const categories = await categoriesFromDb(env.DB);
      const category = requested === "all" ? undefined : categories.find((item) => item.slug === requested || item.id === requested || (requested === "kituri" && categoryIntent(item) === "kituri"));
      if (requested !== "all" && !category) return response("/404", 404, true);
      const query = category
        ? env.DB.prepare("SELECT slug, name, price, category FROM products WHERE (category = ? OR category = ?) AND slug IS NOT NULL AND slug != '' AND price > 0 ORDER BY name").bind(category.slug, category.id || category.slug)
        : env.DB.prepare("SELECT slug, name, price, category FROM products WHERE slug IS NOT NULL AND slug != '' AND price > 0 ORDER BY name");
      const products = await query.all<{ slug: string; name: string; price: number; category: string }>();
      if (category && !products.results?.length) return response("/404", 404, true);
      const intent = categoryIntent(category);
      const rows = (products.results ?? []).filter((product) => intent !== "kituri" || isSurveillanceKit(product.name));
      const productCategories = rows.map((product) => product.category);
      const resolvedSlug = category ? resolveCategorySlug(category.slug, categories, productCategories) : "all";
      const canonical = intent === "kituri" ? "/seturi-camere-supraveghere/" : canonicalPath(`/produse?cat=${encodeURIComponent(resolvedSlug)}`);
      if (url.pathname !== new URL(canonical, url).pathname || (intent === "kituri" && path !== "/seturi-camere-supraveghere") || (category && intent !== "kituri" && requested !== resolvedSlug)) {
        const target = new URL(canonical, url.origin);
        for (const [key, value] of url.searchParams) if (key !== "cat") target.searchParams.append(key, value);
        return new Response(null, { status: 301, headers: { Location: target.pathname + target.search } });
      }
      const label = intent === "kituri" ? "Seturi camere de supraveghere" : category?.label || "Camere de supraveghere, seturi, NVR și alarme";
      const copy = categorySeo(intent, "ro", label);
      const title = category?.seoTitle?.trim() || copy.title;
      const description = category?.seoDescription?.trim() || copy.desc;
      const guide = CATEGORY_GUIDES[intent]?.ro;
      const intro = category?.seoIntro?.trim() || guide?.copy || description;
      const crumbs = [{ name: "Acasă", url: "/" }, { name: "Produse", url: "/produse/" }, ...(category ? [{ name: label, url: canonical }] : [])];
      const links = rows.map((product) => `<li><a href="/product/${encodeURIComponent(product.slug)}/">${escapeHtml(product.name)}</a> — ${escapeHtml(product.price)} MDL</li>`).join("");
      const categoryLinks = !category ? `<nav aria-label="Categorii">${categories.map((c) => {
        const slug = resolveCategorySlug(c.slug, categories, productCategories);
        const href = categoryIntent(c) === "kituri" ? "/seturi-camere-supraveghere/" : canonicalPath(`/produse?cat=${encodeURIComponent(slug)}`);
        return `<a href="${escapeHtml(href)}">${escapeHtml(c.label)}</a>`;
      }).join(" · ")}</nav>` : "";
      const body = `<nav aria-label="Navigare">${crumbs.map((c) => `<a href="${escapeHtml(c.url)}">${escapeHtml(c.name)}</a>`).join(" › ")}</nav><h1>${escapeHtml(label)}</h1><p>${escapeHtml(description)}</p>${categoryLinks}<p>${rows.length} produse disponibile în catalog. Verifică stocul pe pagina produsului.</p><ul>${links}</ul><section><h2>${escapeHtml(guide?.heading || `Cum alegi ${label}?`)}</h2><p>${escapeHtml(intro)}</p></section><a href="/servicii/">Instalare și configurare</a> · <a href="/oferta/">Cere o ofertă pentru obiectul tău</a> · <a href="/blog/">Ghiduri de alegere</a>`;
      return dynamicPage(title, description, canonical, body, [
        { "@context": "https://schema.org", "@type": "CollectionPage", name: label, description, url: `https://teco.md${canonical}`, mainEntity: { "@type": "ItemList", numberOfItems: rows.length, itemListElement: rows.map((p, i) => ({ "@type": "ListItem", position: i + 1, name: p.name, url: `https://teco.md/product/${encodeURIComponent(p.slug)}/` })) } },
        { "@context": "https://schema.org", "@type": "BreadcrumbList", itemListElement: crumbs.map((c, i) => ({ "@type": "ListItem", position: i + 1, name: c.name, item: `https://teco.md${c.url}` })) },
      ], url.searchParams.has("q") || url.searchParams.get("oferte") === "1");
    } catch {
      return new Response("Pagina nu este disponibilă temporar.", { status: 503, headers: { "Retry-After": "60", "Cache-Control": "no-store" } });
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
        const titleMeta = escapeHtml(dynamic[1] === "product" ? productSeoTitle(row.name, row.brand, row.model) : seoSnippet(row.meta_title || `${row.title} | TECO.md`, 62));
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
          ? `<script type="application/ld+json">${JSON.stringify(buildProductSchema({
              id: Number(row.id), slug: String(row.slug || row.id), name: String(row.name || row.title),
              description: String(row.description || ""), brand: String(row.brand || ""), model: String(row.model || ""),
              category: String(row.category || ""), imageUrl: productImage, price,
              inStock: row.in_stock === 1 || row.in_stock === true,
            })).replace(/</g, "\\u003c")}</script>`
          : "";
        const articleSchema = dynamic[1] === "blog"
          ? `<script type="application/ld+json">${JSON.stringify({
              "@context": "https://schema.org", "@type": "BlogPosting", headline: String(row.title),
              description: rawDescription, image: [absoluteImage(productImage && !productImage.startsWith("data:") ? productImage : "/opengraph.jpg")],
              url: `https://teco.md${canonical}`, datePublished: row.published_at, dateModified: row.updated_at || row.published_at,
              author: { "@type": "Organization", name: "TECO.md", url: "https://teco.md/", logo: { "@type": "ImageObject", url: "https://teco.md/logo.png" } },
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
        let productLinks = "";
        let breadcrumbSchema = "";
        if (dynamic[1] === "product") {
          const categoryKey = String(row.category || "");
          let categoryLabel = categoryKey;
          let related: Array<{ slug: string; name: string }> = [];
          if (categoryKey) {
            // Secondary navigation must never make an otherwise valid product fail.
            const db = env.DB;
            const fetchRelated = async () => {
              const result = await db.prepare("SELECT slug, name FROM products WHERE category = ? AND id != ? AND price > 0 AND slug IS NOT NULL AND slug != '' ORDER BY name LIMIT 4")
                .bind(categoryKey, row.id).all<{ slug: string; name: string }>();
              return result.results ?? [];
            };
            const [categories, alternatives] = await Promise.all([
              categoriesFromDb(db).catch((): RuntimeCategory[] => []),
              fetchRelated().catch((): Array<{ slug: string; name: string }> => []),
            ]);
            categoryLabel = categories.find((c) => c.id === categoryKey || c.slug === categoryKey)?.label || categoryKey;
            related = alternatives;
          }
          const categoryPath = categoryKey ? canonicalPath(`/produse?cat=${encodeURIComponent(categoryKey)}`) : "";
          const crumbs = [
            { name: "Acasă", url: "/" }, { name: "Produse", url: "/produse/" },
            ...(categoryPath ? [{ name: categoryLabel, url: categoryPath }] : []),
            { name: String(row.name), url: canonical },
          ];
          productLinks = `<nav aria-label="Navigare produs">${crumbs.map((c) => `<a href="${escapeHtml(c.url)}">${escapeHtml(c.name)}</a>`).join(" › ")}</nav>`;
          if (related.length) productLinks += `<section><h2>Produse similare</h2><ul>${related.map((p) => `<li><a href="/product/${encodeURIComponent(p.slug)}/">${escapeHtml(p.name)}</a></li>`).join("")}</ul></section>`;
          breadcrumbSchema = `<script type="application/ld+json">${JSON.stringify({ "@context": "https://schema.org", "@type": "BreadcrumbList", itemListElement: crumbs.map((c, i) => ({ "@type": "ListItem", position: i + 1, name: c.name, item: `https://teco.md${c.url}` })) }).replace(/</g, "\\u003c")}</script>`;
        }
        const technicalRows = productSpecRows(row.tech_specs).map(([label, value]) =>
          `<tr><th scope="row">${escapeHtml(label)}</th><td>${escapeHtml(value)}</td></tr>`).join("");
        const extraCopy = dynamic[1] === "product"
          ? `${longDescription && longDescription !== readableText(rawDescription) ? `<section><h2>Descriere detaliată</h2><p>${escapeHtml(longDescription)}</p></section>` : ""}${specs ? `<section><h2>Caracteristici</h2><p>${escapeHtml(specs)}</p></section>` : ""}${technicalRows ? `<section><h2>Specificații tehnice</h2><table><tbody>${technicalRows}</tbody></table></section>` : ""}${productLinks}`
          : "";
        html = html.replace("</head>", `${breadcrumbSchema}</head>`);
        const articleCopy = dynamic[1] === "blog" ? renderArticleHtml(row.content) : "";
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
