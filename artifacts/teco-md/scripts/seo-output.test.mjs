import test from "node:test";
import assert from "node:assert/strict";
import { makeSitemap, documentHtml, isIndexableHead, legacyRedirects } from "./seo-output.mjs";
import { canonicalPath } from "../src/lib/seo-url.ts";
import { serveHtml } from "../src/server/seo-handler.ts";
import { currentProductDescription, productSeoTitle, productSeoDescription } from "../src/lib/product-copy.ts";

test("canonical URLs preserve category identity and remove tracking parameters", () => {
  assert.equal(canonicalPath("/servicii?utm_source=test"), "/servicii/");
  assert.equal(canonicalPath("/produse/?cat=Sisteme%20De%20Alarma%20&utm_source=test"), "/produse/?cat=Sisteme%20De%20Alarma%20");
  assert.equal(canonicalPath("/produse?cat=all"), "/produse/");
});
test("sitemap includes each canonical page once and escapes XML", () => {
  const xml = makeSitemap(["/servicii/", "/servicii/", "/produse/?cat=A&B"]);
  assert.equal((xml.match(/<url>/g) || []).length, 2);
  assert.ok(xml.includes("A&amp;B"));
  assert.ok(!xml.includes("hreflang") && !xml.includes("lastmod"));
});
test("runtime sitemap reflects published articles and current products from D1", async () => {
  const base = makeSitemap(["/", "/produse/?cat=retired", "/product/retired/", "/blog/", "/blog/old-post/"]);
  const assets = { async fetch() { return new Response(base, { headers: { "Content-Type": "application/xml" } }); } };
  const db = { prepare(sql) { return {
    async first() { return { data: JSON.stringify({ categories: [{ slug: "wifi", label: "Camere WiFi" }] }) }; },
    async all() { return { results: sql.includes("FROM products")
      ? [{ slug: "new-camera", category: "wifi" }] : [{ slug: "ajax-guide" }] }; },
  }; } };
  const response = await serveHtml(new Request("https://teco.md/sitemap.xml"), { ASSETS: assets, DB: db }, { pages: {}, redirects: {} });
  const xml = await response.text();
  assert.equal(response.status, 200);
  assert.ok(xml.includes("/product/new-camera/") && xml.includes("/blog/ajax-guide/"));
  assert.ok(xml.includes("/produse/?cat=wifi") && xml.includes("https://teco.md/blog/"));
  assert.ok(!xml.includes("/produse/?cat=retired"));
  assert.ok(!xml.includes("/product/retired/") && !xml.includes("/blog/old-post/"));
});
test("a new admin category with products is crawlable before another build", async () => {
  const db = { prepare(sql) { return {
    async first() { assert.ok(sql.includes("settings")); return { data: JSON.stringify({ categories: [{ id: "solar", slug: "solar", label: "Camere solare", seoTitle: "Camere solare | Teco.md", seoDescription: "Camere solare pentru terenuri în Moldova.", seoIntro: "Verifică autonomia și semnalul 4G." }] }) }; },
    bind(...keys) { assert.deepEqual(keys, ["solar", "solar"]); return { async all() { return { results: [{ slug: "camera-solara", name: "Cameră solară 4G", price: 3100, category: "solar" }] }; } }; },
  }; } };
  const assets = { async fetch() { return new Response('<html><head><meta name="robots" content="noindex, follow"></head><body><div id="root"></div></body></html>'); } };
  const res = await serveHtml(new Request("https://teco.md/produse/?cat=solar"), { ASSETS: assets, DB: db }, { pages: {}, redirects: {} });
  const html = await res.text();
  assert.equal(res.status, 200);
  assert.ok(html.includes("Camere solare | Teco.md") && html.includes("Verifică autonomia"));
  assert.ok(html.includes('/product/camera-solara/') && html.includes('href="https://teco.md/produse/?cat=solar"'));
  assert.ok(!html.includes('name="robots" content="noindex'));
});
test("renamed alarm categories remain in the sitemap under the actual product category", async () => {
  const assets = { async fetch() { return new Response(makeSitemap(["/", "/produse/?cat=alarme", "/seturi-camere-supraveghere/"])); } };
  const db = { prepare(sql) { return {
    async first() { return { data: JSON.stringify({ categories: [
      { id: "alarme", slug: "Sisteme-De-Alarma ", label: "Sisteme Alarmă" },
      { id: "kituri", slug: "Seturi-Complete-Camere-Supraveghere", label: "Seturi Complete" },
    ] }) }; },
    async all() { return { results: sql.includes("FROM products") ? [
      { slug: "ajax-starter", category: "alarme" },
      { slug: "kit-video", category: "Seturi-Complete-Camere-Supraveghere" },
    ] : [] }; },
  }; } };
  const res = await serveHtml(new Request("https://teco.md/sitemap.xml"), { ASSETS: assets, DB: db }, { pages: {}, redirects: {} });
  const xml = await res.text();
  assert.ok(xml.includes("https://teco.md/produse/?cat=alarme</loc>"));
  assert.ok(!xml.includes("?cat=Sisteme-De-Alarma") && !xml.includes("?cat=Seturi-Complete"));
  assert.ok(xml.includes("https://teco.md/seturi-camere-supraveghere/</loc>"));
});
test("custom alarm metadata works when products use the historic category id", async () => {
  const db = { prepare() { return {
    async first() { return { data: JSON.stringify({ categories: [{ id: "alarme", slug: "Sisteme-De-Alarma ", label: "Sisteme Alarmă", seoTitle: "Alarme Ajax | Teco.md" }] }) }; },
    bind(...keys) { assert.deepEqual(keys, ["Sisteme-De-Alarma ", "alarme"]); return { async all() { return { results: [{ slug: "ajax", name: "Ajax Starter", price: 10000, category: "alarme" }] }; } }; },
  }; } };
  const assets = { async fetch() { return new Response('<html><head></head><body><div id="root"></div></body></html>'); } };
  const res = await serveHtml(new Request("https://teco.md/produse/?cat=alarme"), { ASSETS: assets, DB: db }, { pages: { "/produse/?cat=alarme": "/__seo/old/" }, redirects: {} });
  const html = await res.text();
  assert.ok(html.includes("Alarme Ajax | Teco.md") && html.includes('/product/ajax/'));
  assert.ok(html.includes('rel="canonical" href="https://teco.md/produse/?cat=alarme"'));
});
test("unpublishing an article removes even a previously prerendered page", async () => {
  const db = { prepare() { return { bind() { return { async first() { return null; } }; } }; } };
  const assets = { async fetch() { return new Response("PAGE"); } };
  const res = await serveHtml(new Request("https://teco.md/blog/removed/"), { ASSETS: assets, DB: db }, { pages: { "/blog/removed/": "/__seo/old/" }, redirects: {} });
  assert.equal(res.status, 404);
  assert.equal(res.headers.get("X-Robots-Tag"), "noindex, follow");
});
test("newly published articles appear in the crawlable blog index", async () => {
  const db = { prepare() { return { async all() { return { results: [{ slug: "ghid-ajax", title: "Ghid Ajax", description: "Alegerea senzorilor." }] }; } }; } };
  const assets = { async fetch() { return new Response('<html><head></head><body><div id="root"></div></body></html>'); } };
  const res = await serveHtml(new Request("https://teco.md/blog/"), { ASSETS: assets, DB: db }, { pages: { "/blog/": "/__seo/old-blog/" }, redirects: {} });
  const html = await res.text();
  assert.equal(res.status, 200);
  assert.ok(html.includes('/blog/ghid-ajax/') && !html.includes("old-blog"));
});
test("static head replaces old metadata and uses the actual rendered page", () => {
  const html = documentHtml('<html><head><title>Old</title><link rel="canonical" href="/"><script type="application/ld+json">{}</script></head><body><div id="root"><!--app-html--></div></body></html>', { head: '<title>Contact</title><link rel="canonical" href="https://teco.md/contact/">', body: '<h1>Contact</h1><a href="tel:+37367200463">Sună</a>' });
  assert.equal((html.match(/<title/g) || []).length, 1);
  assert.ok(!html.includes('href="/"') && !html.includes('ld+json'));
  assert.ok(html.includes('data-teco-prerender') && html.includes('<h1>Contact</h1>'));
});
test("noindex pages are excluded from the sitemap regardless of meta attribute order", () => {
  assert.equal(isIndexableHead('<meta name="robots" content="noindex, follow">'), false);
  assert.equal(isIndexableHead('<meta content="noindex, follow" name="robots">'), false);
  assert.equal(isIndexableHead('<meta name="robots" content="index, follow">'), true);
});

const manifest = { pages: { "/contact/": "/__seo/contact/", "/produse/?cat=wifi": "/__seo/wifi/" }, redirects: legacyRedirects([{ id: 6, slug: "camera-reala" }]) };
const env = { ASSETS: { async fetch(request) { return new Response(`<html>${new URL(request.url).pathname}</html>`, { headers: { "Content-Type": "text/html" } }); } } };
test("legacy contact redirects in one hop, retaining campaign attribution", async () => {
  const response = await serveHtml(new Request("https://teco.md/contacts/?utm_source=google"), env, manifest);
  assert.equal(response.status, 301);
  assert.equal(response.headers.get("Location"), "/contact/?utm_source=google");
});
test("existing numeric products resolve to their own product, not the catalog", async () => {
  const response = await serveHtml(new Request("https://teco.md/product/6"), env, manifest);
  assert.equal(response.headers.get("Location"), "/product/camera-reala/");
  assert.equal(manifest.redirects["/product/88"], undefined);
});
test("retired Russian products do not redirect to an unrelated installation service", async () => {
  const response = await serveHtml(new Request("https://teco.md/ru/old-tv-box/"), env, manifest);
  assert.equal(response.status, 404);
  assert.equal(response.headers.get("X-Robots-Tag"), "noindex, follow");
});
test("category pages serve their own HTML, with tracking params ignored for selection", async () => {
  const response = await serveHtml(new Request("https://teco.md/produse/?cat=wifi&utm_source=google"), env, manifest);
  assert.equal(response.status, 200);
  assert.ok((await response.text()).includes("/__seo/wifi/"));
});
test("HEAD responses and private pages retain their correct status and indexing policy", async () => {
  const response = await serveHtml(new Request("https://teco.md/contact/", { method: "HEAD" }), env, manifest);
  assert.equal(response.status, 200);
  assert.equal(await response.text(), "");
  const admin = await serveHtml(new Request("https://teco.md/admin/"), env, manifest);
  assert.equal(admin.headers.get("X-Robots-Tag"), "noindex, follow");
});
test("a database outage never reports a new valid product as deleted", async () => {
  const response = await serveHtml(new Request("https://teco.md/product/new-camera/"), { ...env, DB: { prepare() { throw new Error("unavailable"); } } }, manifest);
  assert.equal(response.status, 503);
});

test("renamed category URLs redirect directly to the actual category", async () => {
  const custom = { ...manifest, queryRedirects: { "/produse/?cat=alarme": "/produse/?cat=Sisteme-De-Alarma%20" } };
  const response = await serveHtml(new Request("https://teco.md/alarme?utm_source=google"), env, custom);
  assert.equal(response.status, 301);
  const target = new URL(response.headers.get("Location"), "https://teco.md");
  assert.equal(target.pathname, "/produse/");
  assert.equal(target.searchParams.get("cat"), "Sisteme-De-Alarma ");
  assert.equal(target.searchParams.get("utm_source"), "google");
});
test("kit query aliases share one canonical landing page", async () => {
  const custom = { ...manifest, queryRedirects: { "/produse/?cat=kituri": "/seturi-camere-supraveghere/" } };
  const response = await serveHtml(new Request("https://teco.md/produse?cat=kituri&utm_source=google"), env, custom);
  assert.equal(response.headers.get("Location"), "/seturi-camere-supraveghere/?utm_source=google");
});

test("an indexed old kits category redirects to its relevant live landing page", async () => {
  const custom = { ...manifest, queryRedirects: { "/produse/?cat=Seturi-Complete-Camere-Supraveghere": "/seturi-camere-supraveghere/" } };
  const response = await serveHtml(new Request("https://teco.md/produse/?cat=Seturi-Complete-Camere-Supraveghere&utm_source=google"), env, custom);
  assert.equal(response.status, 301);
  assert.equal(response.headers.get("Location"), "/seturi-camere-supraveghere/?utm_source=google");
});

test("product metadata comes from the live database even when a stale prerender exists", async () => {
  const product = { id: 146, slug: "camera-tiandy", name: "Camera Tiandy", price: 26992, in_stock: 1,
    image_url: "/api/site-image/tiandy-photo", brand: "TIANDY", description: "Camera IP Tiandy 8MP la prețul de 18699 MDL." };
  const db = { prepare() { return { bind() { return { async first() { return product; } }; } }; } };
  const assets = { async fetch(request) {
    const path = new URL(request.url).pathname;
    return new Response(path === "/app" ? '<html><head><meta name="robots" content="noindex, follow"></head><body><div id="root"></div></body></html>' : "OLD PRICE 18699", { headers: { "Content-Type": "text/html" } });
  } };
  const result = await serveHtml(new Request("https://teco.md/product/camera-tiandy/"),
    { ASSETS: assets, DB: db }, { pages: { "/product/camera-tiandy/": "/__seo/stale/" }, redirects: {} });
  const html = await result.text();
  assert.equal(result.status, 200);
  assert.ok(html.includes('"price":26992') && html.includes('"priceCurrency":"MDL"'));
  assert.ok(html.includes('og:image" content="https://teco.md/api/site-image/tiandy-photo"'));
  assert.ok(html.includes("Camera IP Tiandy 8MP") && !html.includes("OLD PRICE 18699") && !html.includes("18699 MDL"));
  assert.ok(!html.includes('name="robots" content="noindex'));
});

test("a stale standalone price claim changes without rewriting genuine comparison or bundle amounts", () => {
  assert.equal(currentProductDescription("Kit la prețul de 18699 MDL.", 26992), "Kit la prețul de 26.992 MDL.");
  assert.equal(currentProductDescription("Preț vechi 18699 MDL; preț nou 26992 MDL.", 26992), "Preț vechi 18699 MDL; preț nou 26992 MDL.");
  assert.equal(currentProductDescription("HDD 1000 MDL și montaj 650 MDL incluse.", 26992), "HDD 1000 MDL și montaj 650 MDL incluse.");
});

test("long catalog names and descriptions produce concise, current product snippets", () => {
  const name = "Camera de supraveghere smart / inteligenta IMOU Bullet 3 IPC-S3EP-5M0WE, 5MP, Wi-Fi, microfon, difuzor, interior / exterior";
  const description = "Camera IP IMOU de exterior la prețul de 18699 MDL. " + "Detecție de persoane și vedere nocturnă pentru curte. ".repeat(9);
  assert.ok(productSeoTitle(name).length <= 63);
  const snippet = productSeoDescription(description, name, 26992);
  assert.ok(snippet.length <= 155);
  assert.ok(snippet.includes("26.992 MDL"));
});

test("live product HTML includes unique product information and bounded metadata", async () => {
  const name = "Camera de supraveghere smart / inteligenta IMOU Bullet 3 IPC-S3EP-5M0WE, 5MP, Wi-Fi, microfon, difuzor, interior / exterior";
  const row = { id: 159, slug: "imou-bullet-3", name, brand: "IMOU", price: 1699, in_stock: 1,
    description: "Camera de exterior cu detecție de persoane și vedere nocturnă. ".repeat(6),
    long_description: "Utilizare pentru curte și intrare. Configurare din aplicația mobilă.",
    specs: "5MP | WiFi | IP67", image_url: "/product-images/159.webp" };
  const db = { prepare() { return { bind() { return { async first() { return row; } }; } }; } };
  const assets = { async fetch() { return new Response('<html><head></head><body><div id="root"></div></body></html>'); } };
  const res = await serveHtml(new Request("https://teco.md/product/imou-bullet-3/"), { ASSETS: assets, DB: db }, { pages: {}, redirects: {} });
  const html = await res.text();
  const title = html.match(/<title[^>]*>(.*?)<\/title>/)?.[1];
  const desc = html.match(/name="description" content="([^"]*)"/)?.[1];
  assert.ok(title && title.length <= 63);
  assert.ok(desc && desc.length <= 155);
  assert.ok(html.includes("Configurare din aplicația mobilă") && html.includes("5MP | WiFi | IP67"));
  assert.ok(html.includes('rel="canonical" href="https://teco.md/product/imou-bullet-3/"'));
});

test("article edits override prerendered content without another deployment", async () => {
  const article = { slug: "alegere-ajax", title: "Cum alegi o alarmă Ajax pentru casă", description: "Ghid pentru alegerea senzorilor Ajax.",
    meta_title: "Alarmă Ajax: alegerea senzorilor | Teco.md", meta_description: "Ghid practic pentru senzorii Ajax potriviți casei tale.",
    content: "## Ce protejezi?\nCompară intrarea, ferestrele și spațiile interioare.\n### Configurare\nAlege senzorii potriviți.", published_at: "2026-09-29", updated_at: "2026-09-30", image_url: "/product-images/ajax.webp" };
  const db = { prepare() { return { bind() { return { async first() { return article; } }; } }; } };
  const assets = { async fetch() { return new Response('<html><head></head><body><div id="root"></div></body></html>'); } };
  const response = await serveHtml(new Request("https://teco.md/blog/alegere-ajax/"), { ASSETS: assets, DB: db }, { pages: { "/blog/alegere-ajax/": "/__seo/stale/" }, redirects: {} });
  const html = await response.text();
  assert.equal(response.status, 200);
  assert.ok(html.includes("<h2>Ce protejezi?</h2>") && html.includes("Alege senzorii potriviți."));
  assert.ok(html.includes(article.meta_title) && html.includes(article.meta_description));
  assert.ok(html.includes('property="og:image" content="https://teco.md/product-images/ajax.webp"'));
  assert.ok(html.includes('"@type":"BlogPosting"'));
});
