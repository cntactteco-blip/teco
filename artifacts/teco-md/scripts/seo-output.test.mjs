import test from "node:test";
import assert from "node:assert/strict";
import { makeSitemap, documentHtml, isIndexableHead, legacyRedirects } from "./seo-output.mjs";
import { canonicalPath } from "../src/lib/seo-url.ts";
import { serveHtml } from "../src/server/seo-handler.ts";

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
