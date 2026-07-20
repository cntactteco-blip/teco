---
name: Supabase architecture → SQLite migration
description: Supabase a fost eliminat complet. Toate datele sunt acum în SQLite local pe api-server.
---

## Starea curentă (post-migrare)

**Supabase a fost eliminat complet.** Nu mai există niciun apel Supabase în cod.

### Înlocuiri:
- `artifacts/api-server/src/db.ts` — SQLite singleton (`data/teco.db`), WAL mode
- `artifacts/api-server/src/services/supabase.ts` — rescris cu SQLite (același API pentru notify.ts)
- `artifacts/api-server/src/routes/settings.ts` — CRUD complet: settings, products, leads, orders, blog-posts
- `artifacts/teco-md/src/lib/store.ts` — ZERO apeluri Supabase; totul merge prin api-server

### Frontend store.ts:
- `refreshFromSupabase()` = alias pentru `refreshFromApiServer()` (compatibilitate Admin.tsx)
- Vizitatori: snapshot JSON + localStorage, FĂRĂ apeluri api-server
- Admin: `refreshFromApiServer()` fetch toate tabelele din api-server

### Seed la pornire:
- `artifacts/api-server/src/routes/settings.ts` citește `catalog-snapshot.json` și face seed dacă `products` table e goală
- Produse: 42 produse din snapshot

### Deduplicare lead notifications (Task #14):
- `canNotifyPhone(phone, date)` în notify.ts: SQLite `ip_rate_limits` cu `type='lead-notify'`, limit=1/zi
- Fallback in-memory cu TTL 24h
- Cross-endpoint: chat-lead și calculator împart același contor

**Why:** Supabase free tier se pauzează după 1 săptămână inactivitate și poate fi down. SQLite pe Replit e gratuit, persistent, niciodată offline.

**How to apply:** Orice operație cu date → api-server (`_API + "/api/..."`) sau direct în db.ts. Nu mai folosi `supabase.from(...)` nicăieri.
