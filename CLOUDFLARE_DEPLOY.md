# Deploy Teco.md pe Cloudflare Pages

## Pasul 1 — Conectează repo-ul GitHub la Cloudflare Pages

1. Mergi la [dash.cloudflare.com](https://dash.cloudflare.com) → **Workers & Pages** → **Create** → **Pages**
2. Conectează-ți contul GitHub și selectează repo-ul cu acest proiect

## Pasul 2 — Setează configurația build-ului

| Câmp | Valoare |
|------|---------|
| **Framework preset** | None |
| **Build command** | `pnpm install && pnpm --filter @workspace/teco-md run cf-build` |
| **Build output directory** | `artifacts/teco-md/dist` |
| **Root directory** | *(lasă gol — rădăcina repo-ului)* |
| **Node.js version** | 22 |

## Pasul 3 — Adaugă variabilele de mediu (Environment Variables)

În Cloudflare Pages → **Settings** → **Environment Variables**, adaugă:

| Variabilă | Valoare |
|-----------|---------|
| `VITE_SUPABASE_URL` | URL-ul proiectului tău Supabase (ex: `https://xxx.supabase.co`) |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | `anon` key din Supabase → Settings → API |

> Fără aceste variabile, magazinul va funcționa în modul offline (date în localStorage, nu persistă între dispozitive).

## Pasul 4 — Configurează Supabase

1. Mergi la [supabase.com](https://supabase.com) → proiectul tău → **SQL Editor**
2. Copiază conținutul din `artifacts/teco-md/supabase-setup.sql` și apasă **Run**
3. Aceasta creează tabelele: `products`, `leads`, `orders`, `settings`

## Ce se întâmplă la fiecare push

Cloudflare Pages va rula automat build-ul și va publica noua versiune în ~2 minute.

## Routing SPA

Fișierul `public/_redirects` cu regula `/* /index.html 200` este inclus automat în build.  
Toate rutele (`/produse`, `/checkout`, `/admin`, etc.) vor funcționa corect.
