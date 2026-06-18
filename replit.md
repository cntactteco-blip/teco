# Teco.md — Sisteme de Supraveghere

An e-commerce web app for a surveillance systems shop based in Moldova. Sells security cameras, NVRs, kits, and alarm systems. Available in Romanian and Russian.

## Run & Operate

- `pnpm --filter @workspace/teco-md run dev` — run the frontend (port assigned by workflow)
- `pnpm --filter @workspace/api-server run dev` — run the API server (port 8080)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Required env: `DATABASE_URL` — Postgres connection string
- Optional env: `VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY` — if using Supabase; falls back to localStorage mock

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- Frontend: Vite + React, Tailwind CSS v4, wouter for routing
- State: custom Zustand-like store (`src/lib/store.ts`) backed by Supabase or localStorage mock
- API: Express 5
- DB: PostgreSQL + Drizzle ORM
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec)
- Build: esbuild (CJS bundle)

## Where things live

- `artifacts/teco-md/src/` — frontend React app
- `artifacts/teco-md/src/pages/` — page-level route components (Home, Products, ProductDetail, Checkout, Admin, Cart)
- `artifacts/teco-md/src/components/` — UI and feature components
- `artifacts/teco-md/src/lib/store.ts` — global state (products, leads, orders, settings)
- `artifacts/teco-md/src/lib/supabase.ts` — Supabase client with offline localStorage fallback
- `artifacts/teco-md/src/lib/products.ts` — seed product catalog
- `artifacts/teco-md/src/contexts/LangContext.tsx` — RO/RU language toggle
- `artifacts/api-server/` — Express backend
- `lib/db/` — Drizzle ORM schema and DB connection

## Architecture decisions

- Offline-first: the app works without Supabase by using a localStorage-backed mock client. When `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY` are set, real Supabase is used instead.
- The mock Supabase client supports full method chaining (`.select().order()`, `.update().eq()`, etc.) to match real Supabase behavior.
- Language toggle (RO/RU) is handled via React context; all UI strings are in `src/lib/translations.ts`.
- The `/admin` route bypasses the shop shell (header/footer) and renders a full-page admin dashboard.

## Product

- Homepage with hero, brand comparator, product carousels, and social proof
- Product listing and detail pages with add-to-cart
- Cart drawer with checkout flow
- Admin panel: manage products, leads, and orders
- Import products via XLSX
- Romanian/Russian language toggle

## User preferences

_Populate as you build — explicit user instructions worth remembering across sessions._

## Gotchas

- The app ships with a mock Supabase client (`src/lib/supabase.ts`). Without real Supabase credentials, data persists in localStorage. Seed products are auto-inserted on first run.
- Never run `pnpm dev` at workspace root — use `restart_workflow` or the workflow panel.
- UI components in `src/components/ui/` are from the Replit scaffold (Tailwind v4 + CVA). The original theme uses hex CSS variables (`--primary: #FF4F00`) not HSL.

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
