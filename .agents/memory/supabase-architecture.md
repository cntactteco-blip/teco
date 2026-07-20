---
name: Supabase architecture — teco.md
description: How Supabase is used, egress limits, visitor vs admin data loading pattern
---

# Supabase architecture for teco.md

## Rule: ZERO Supabase calls for regular visitors
**Why:** Supabase free NANO tier exhausted 3.95/5 GB egress in one billing cycle. Each visitor load fetched ~800 KB from Supabase (42 products + settings with base64 category images). A few thousand visits depleted the limit.

**How to apply:**
- `initStore()` is now synchronous and instant — loads from snapshot/localStorage only, no network call
- `refreshFromSupabase()` is async and ONLY called from Admin panel (on auth + after import)
- Never add Supabase fetches in components that are visible to regular visitors

## Settings cache invalidation
- Cache version: `SETTINGS_CACHE_VERSION = 2` (bump when DEFAULT_CATEGORIES change)
- `_v` field stored with settings in localStorage
- Auto-invalidates if first category image is an Unsplash URL (sign of corrupted DEFAULT cache)
- **Why:** When Supabase was paused, `initStore` wrote DEFAULT_SETTINGS (with wrong headphones Unsplash URL) over the correct category images

## Supabase service role key
- Var name: `SUPABASE_SERVICE_ROLE_KEY` (set in Replit secrets)
- Picked up in api-server `src/services/supabase.ts` — checked before anon key
- Required for writing to: `sessions`, `sales`, `ip_rate_limits` (those tables have no anon RLS policies)
- **Why:** Without service role key, analytics writes fail silently; only anon key → RLS blocks

## Supabase project status (as of July 2026)
- Free NANO tier, AWS eu-central-1
- Was "Unhealthy" / CPU 100% due to excessive visitor queries
- After fix: only admin panel queries Supabase → project should recover

## Supabase query builder gotcha
- `.catch()` does NOT work directly on Supabase query builder chain
- Must wrap: `Promise.resolve(supabase.from(...).select(...).order(...)).catch(() => fallback)`
- **Why:** Supabase query builder is "thenable" but not a full Promise

## blog_posts table
- Was missing from original `supabase-setup.sql` — added to `supabase-full-migration.sql`
- `seedBlogPostsIfEmpty()` is wrapped in try/catch to handle missing table gracefully
