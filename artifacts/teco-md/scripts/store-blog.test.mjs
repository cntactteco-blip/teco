import test from "node:test";
import assert from "node:assert/strict";
import { createServer } from "vite";
import { resolve } from "node:path";

test("recent product cache cannot suppress blog edits, new articles or withdrawals", async () => {
  const oldStorage = globalThis.localStorage;
  const oldFetch = globalThis.fetch;
  const cached = { id: "cached", slug: "cached", title: "Cached article", published: true };
  const cache = new Map([
    ["teco_products_cache", JSON.stringify([{ id: 1, name: "Camera", price: 1000 }])],
    ["teco_products_cache_ts", String(Date.now())],
    ["teco_blog_cache", JSON.stringify([cached])],
  ]);
  globalThis.localStorage = {
    getItem: key => cache.get(key) ?? null,
    setItem: (key, value) => cache.set(key, value),
    removeItem: key => cache.delete(key),
  };
  let rows = [{ id: "new", slug: "new", title: "New article", published: 1 }];
  const requests = [];
  globalThis.fetch = async url => {
    requests.push(url);
    return new Response(JSON.stringify({ data: rows }));
  };
  const vite = await createServer({
    configFile: false, root: resolve(import.meta.dirname, ".."),
    resolve: { alias: { "@": resolve(import.meta.dirname, "../src") } },
    optimizeDeps: { noDiscovery: true, include: [] },
    server: { middlewareMode: true, hmr: false, watch: null }, appType: "custom",
  });
  try {
    const store = await vite.ssrLoadModule("/src/lib/store.ts");
    assert.equal(store.getState().blogPosts[0].slug, "cached");
    const refreshed = async () => {
      store.initStore();
      for (let i = 0; i < 20; i++) await new Promise(resolve => setImmediate(resolve));
    };
    await refreshed();
    assert.deepEqual(requests, ["/api/blog-posts"]);
    assert.equal(store.getState().blogPosts[0].slug, "new");
    rows = [{ ...rows[0], title: "Edited title" }];
    await refreshed();
    assert.equal(store.getState().blogPosts[0].title, "Edited title");
    rows = [];
    await refreshed();
    assert.equal(store.getState().blogPosts.length, 0);
    assert.deepEqual(JSON.parse(cache.get("teco_blog_cache")), []);
  } finally {
    await vite.close();
    globalThis.localStorage = oldStorage;
    globalThis.fetch = oldFetch;
  }
});
