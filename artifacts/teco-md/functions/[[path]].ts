import manifest from "../src/generated/seo-manifest.json";
import { serveHtml } from "../src/server/seo-handler";

export const onRequest: PagesFunction<{ ASSETS: Fetcher; DB: D1Database }> = context =>
  serveHtml(context.request, context.env, manifest);
