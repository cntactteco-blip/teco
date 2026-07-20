-- =============================================================
-- TECO.MD — Migrare completă Supabase (versiunea unificată)
-- Rulează INTEGRAL în Supabase Dashboard → SQL Editor
-- Sigur de rulat de mai multe ori (IF NOT EXISTS + OR REPLACE)
-- =============================================================

-- ─── 1. TABELE FRONTEND (produse, lead-uri, comenzi) ────────

CREATE TABLE IF NOT EXISTS products (
  id               SERIAL      PRIMARY KEY,
  name             TEXT        NOT NULL,
  model            TEXT        NOT NULL DEFAULT '',
  brand            TEXT        NOT NULL DEFAULT '',
  price            INTEGER     NOT NULL DEFAULT 0,
  old_price        INTEGER,
  specs            TEXT        NOT NULL DEFAULT '',
  badge            TEXT,
  category         TEXT        NOT NULL DEFAULT '',
  image_url        TEXT        NOT NULL DEFAULT '',
  images           JSONB       DEFAULT '[]',
  description      TEXT        NOT NULL DEFAULT '',
  long_description TEXT,
  tech_specs       TEXT,
  in_stock         BOOLEAN     NOT NULL DEFAULT TRUE,
  icon             TEXT        NOT NULL DEFAULT 'shield'
);

CREATE TABLE IF NOT EXISTS leads (
  id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  name       TEXT        NOT NULL,
  phone      TEXT        NOT NULL,
  source     TEXT        NOT NULL DEFAULT '',
  timestamp  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  status     TEXT        NOT NULL DEFAULT 'new',
  notes      TEXT,
  selections JSONB
);

CREATE TABLE IF NOT EXISTS orders (
  id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  customer   JSONB       NOT NULL DEFAULT '{}',
  items      JSONB       NOT NULL DEFAULT '[]',
  total      INTEGER     NOT NULL DEFAULT 0,
  timestamp  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  status     TEXT        NOT NULL DEFAULT 'new'
);

CREATE TABLE IF NOT EXISTS settings (
  id   INTEGER PRIMARY KEY DEFAULT 1,
  data JSONB   NOT NULL DEFAULT '{}'
);

-- ─── 2. TABEL BLOG POSTS (lipsea din migrarea originală) ─────

CREATE TABLE IF NOT EXISTS blog_posts (
  id                  TEXT        PRIMARY KEY,
  slug                TEXT        NOT NULL UNIQUE,
  title               TEXT        NOT NULL DEFAULT '',
  title_ru            TEXT        NOT NULL DEFAULT '',
  description         TEXT        NOT NULL DEFAULT '',
  description_ru      TEXT        NOT NULL DEFAULT '',
  content             TEXT        NOT NULL DEFAULT '',
  content_ru          TEXT        NOT NULL DEFAULT '',
  image_url           TEXT        NOT NULL DEFAULT '',
  category            TEXT        NOT NULL DEFAULT '',
  category_ru         TEXT        NOT NULL DEFAULT '',
  published_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  author              TEXT        NOT NULL DEFAULT 'Teco.md',
  meta_title          TEXT,
  meta_title_ru       TEXT,
  meta_description    TEXT,
  meta_description_ru TEXT,
  keywords            TEXT,
  keywords_ru         TEXT,
  published           BOOLEAN     NOT NULL DEFAULT TRUE,
  reading_time        INTEGER     NOT NULL DEFAULT 5
);

-- ─── 3. TABELE API-SERVER (analytics, vânzări, rate limits) ──

CREATE TABLE IF NOT EXISTS sessions (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id  TEXT        NOT NULL UNIQUE,
  date        DATE        NOT NULL,
  referrer    TEXT,
  utm_source  TEXT,
  utm_medium  TEXT,
  country     TEXT,
  device_type TEXT,
  pages       TEXT[]      DEFAULT '{}',
  is_lead     BOOLEAN     NOT NULL DEFAULT FALSE,
  lead_type   TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS sales (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  date        DATE        NOT NULL,
  amount_mdl  NUMERIC(12, 2),
  description TEXT,
  session_id  TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS ip_rate_limits (
  ip    TEXT    NOT NULL,
  date  DATE    NOT NULL,
  type  TEXT    NOT NULL,
  count INTEGER NOT NULL DEFAULT 1,
  PRIMARY KEY (ip, date, type)
);

-- ─── 4. INDEXURI ─────────────────────────────────────────────

CREATE INDEX IF NOT EXISTS sessions_date_idx       ON sessions (date);
CREATE INDEX IF NOT EXISTS sales_date_idx          ON sales (date);
CREATE INDEX IF NOT EXISTS ip_rate_limits_date_idx ON ip_rate_limits (date);
CREATE INDEX IF NOT EXISTS leads_timestamp_idx     ON leads (timestamp DESC);
CREATE INDEX IF NOT EXISTS orders_timestamp_idx    ON orders (timestamp DESC);
CREATE INDEX IF NOT EXISTS blog_slug_idx           ON blog_posts (slug);

-- ─── 5. AUTO-UPDATE updated_at PENTRU SESSIONS ───────────────

CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS sessions_updated_at ON sessions;
CREATE TRIGGER sessions_updated_at
  BEFORE UPDATE ON sessions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ─── 6. FUNCȚIA RPC ATOMIC INCREMENT ─────────────────────────

CREATE OR REPLACE FUNCTION increment_ip_rate_limit(
  p_ip   TEXT,
  p_date DATE,
  p_type TEXT
) RETURNS INTEGER LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  new_count INTEGER;
BEGIN
  INSERT INTO ip_rate_limits (ip, date, type, count)
  VALUES (p_ip, p_date, p_type, 1)
  ON CONFLICT (ip, date, type)
    DO UPDATE SET count = ip_rate_limits.count + 1
  RETURNING count INTO new_count;
  RETURN new_count;
END;
$$;

-- ─── 7. ROW LEVEL SECURITY ───────────────────────────────────

ALTER TABLE products       ENABLE ROW LEVEL SECURITY;
ALTER TABLE leads          ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders         ENABLE ROW LEVEL SECURITY;
ALTER TABLE settings       ENABLE ROW LEVEL SECURITY;
ALTER TABLE blog_posts     ENABLE ROW LEVEL SECURITY;
ALTER TABLE sessions       ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales          ENABLE ROW LEVEL SECURITY;
ALTER TABLE ip_rate_limits ENABLE ROW LEVEL SECURITY;

-- ── PRODUSE: toți pot citi și modifica (Admin folosește anon key) ──
DROP POLICY IF EXISTS "products_open" ON products;
CREATE POLICY "products_open"
  ON products FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

-- ── LEAD-URI: anon poate INSERT + SELECT; Admin poate tot ──────────
DROP POLICY IF EXISTS "leads_open" ON leads;
CREATE POLICY "leads_open"
  ON leads FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

-- ── COMENZI: la fel ────────────────────────────────────────────────
DROP POLICY IF EXISTS "orders_open" ON orders;
CREATE POLICY "orders_open"
  ON orders FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

-- ── SETTINGS: la fel ───────────────────────────────────────────────
DROP POLICY IF EXISTS "settings_open" ON settings;
CREATE POLICY "settings_open"
  ON settings FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

-- ── BLOG POSTS: public poate citi; Admin poate tot ────────────────
DROP POLICY IF EXISTS "blog_posts_public_select" ON blog_posts;
CREATE POLICY "blog_posts_public_select"
  ON blog_posts FOR SELECT TO anon USING (published = true);

DROP POLICY IF EXISTS "blog_posts_admin_all" ON blog_posts;
CREATE POLICY "blog_posts_admin_all"
  ON blog_posts FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- ── SESSIONS / SALES / IP_RATE_LIMITS: NUMAI service_role ─────────
-- service_role bypass automat RLS → scriere/citire permisă din api-server
-- anon și authenticated → acces blocat (date private de analytics)
-- NU adăuga politici pentru anon pe aceste tabele!

-- =============================================================
-- VERIFICARE — rulează după migrare:
--
-- SELECT table_name, (SELECT count(*) FROM information_schema.table_privileges
--   WHERE table_name = t.table_name AND privilege_type = 'SELECT') as policies
-- FROM information_schema.tables t
-- WHERE table_schema = 'public' ORDER BY table_name;
--
-- SELECT schemaname, tablename, policyname, roles
-- FROM pg_policies WHERE schemaname = 'public';
-- =============================================================
