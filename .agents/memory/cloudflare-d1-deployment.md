---
name: Cloudflare D1 + Pages Functions deployment
description: How the teco-md site is deployed to Cloudflare Pages with D1 database and Pages Functions
---

## Setup

- **Pages project name**: `teco` (domain: `teco-cig.pages.dev`)
- **Account ID**: `70a3c435f8c317681a4b2464c4eaa114`
- **D1 database**: `teco-db` (ID: `7b079aff-44e2-42e9-a7f3-44eae42f5b9e`)
- **D1 binding name**: `DB` (used as `env.DB` in Pages Function)

## Deploy Command

Run from `artifacts/teco-md/`:
```bash
pnpm run cf-build                                    # builds to dist/
CLOUDFLARE_API_TOKEN=... wrangler pages deploy dist --project-name=teco --commit-dirty=true
```

The `functions/api/[[path]].ts` file is automatically picked up by wrangler from the `artifacts/teco-md/` directory.

## Pages Function

- File: `artifacts/teco-md/functions/api/[[path]].ts`
- Router: Hono with `.basePath('/api')`
- Export: `export const onRequest = handle(app)`
- D1 accessed via `c.env.DB` (D1Database, async API)

## API Endpoints

All CRUD:
- GET/POST `/api/settings`
- GET/POST/PUT/DELETE `/api/products[/:id]`
- GET/POST/PATCH/DELETE `/api/leads[/:id/status|notes]`
- GET/POST/PATCH/DELETE `/api/orders[/:id/status]`
- GET/POST/DELETE `/api/blog-posts[/:id]`
- POST `/api/sessions`, POST `/api/sales`, GET `/api/stats/:date`

Notify (Telegram):
- POST `/api/notify/visitor`
- POST `/api/notify/chat-notify` (first chat message)
- POST `/api/notify/chat-lead` (lead from AI chat)
- POST `/api/notify/calculator` (lead from calculator)
- POST `/api/notify/lead` (simple lead)
- POST `/api/notify/order` (new order from checkout)
- POST `/api/notify/daily-report` (admin, protected by SESSION_SECRET header)

## Environment Variables in Pages

Secrets bound: `TELEGRAM_BOT_TOKEN`, `TELEGRAM_CHAT_ID`, `SESSION_SECRET`
Removed (Replit-specific): `VITE_API_URL`, `VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY`, `PORT`, `GROQ_API_KEY`, `VITE_GEMINI_API_KEY`

## D1 Schema Tables

`settings`, `products`, `leads`, `orders`, `blog_posts`, `sessions`, `sales`, `ip_rate_limits`

## Auto-seeding

D1 starts empty. On first `refreshFromApiServer()` call (admin panel), if products is empty, store.ts automatically pushes all current products (from snapshot/localStorage) to D1 via POST `/api/products`.

## API Token

The CLOUDFLARE_API_TOKEN in Replit secrets needs D1 + Pages + Workers permissions.
Token created 2026-07-20 with permissions: D1:Edit, Cloudflare Pages:Edit, Workers Scripts:Edit.

**Why**: The original token only had read permissions and couldn't create D1 databases or deploy functions.

## AI Endpoints (all in Pages Function, Groq via fetch)

- POST `/api/ai/chat` — SSE streaming (TecoBot)
- POST `/api/ai/lead-analyze` — JSON lead scoring
- POST `/api/ai/whatsapp-message` — WhatsApp message generator
- POST `/api/ai/description` — SEO product description
- POST `/api/ai/business-insights` — business analysis
- POST `/api/ai/import-products` — CSV/XLS product import parser
- POST `/api/ai/blog-post` — full SEO blog article (bilingual)

No `groq-sdk` used — all calls via native `fetch` to `https://api.groq.com/openai/v1/chat/completions`.
Streaming uses `TransformStream` + `ReadableStream`, native in CF Workers.
GROQ_API_KEY bound to Pages as secret.

## Cron Trigger (daily Telegram report)

`onScheduled` handler exported from the Pages Function.
Configure in CF Dashboard → Pages → teco → Settings → Functions → Cron Triggers.
Recommended schedule: `0 19 * * *` (22:00 Chișinău / 19:00 UTC).
Pages cron triggers cannot be set via API — dashboard UI only.
