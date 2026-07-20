-- Migration: create sessions table for daily report aggregation
-- Run this in your Supabase project → SQL Editor

CREATE TABLE IF NOT EXISTS sessions (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id   TEXT NOT NULL UNIQUE,
  date         DATE NOT NULL,          -- date in Europe/Chisinau timezone
  referrer     TEXT,
  utm_source   TEXT,
  utm_medium   TEXT,
  country      TEXT,
  device_type  TEXT,
  pages        TEXT[] DEFAULT '{}',    -- ordered list of page paths visited
  is_lead      BOOLEAN NOT NULL DEFAULT FALSE,
  lead_type    TEXT,                   -- 'chat' | 'calculator'
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for daily aggregation queries
CREATE INDEX IF NOT EXISTS sessions_date_idx ON sessions (date);

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER sessions_updated_at
  BEFORE UPDATE ON sessions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- RLS: locked to service_role only.
-- The API server MUST use the Supabase service role key (SUPABASE_SERVICE_KEY),
-- which bypasses RLS entirely, so no anon policies are needed.
-- Anon/public clients cannot read or write session/sales data directly.
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;
-- No policies added: service_role bypasses RLS; all other roles are denied by default.

-- ─── Sales table ─────────────────────────────────────────────────────────────
-- Stores confirmed sales manually reported by the owner via POST /api/notify/sale

CREATE TABLE IF NOT EXISTS sales (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  date        DATE NOT NULL,              -- date in Europe/Chisinau timezone
  amount_mdl  NUMERIC(12, 2),             -- optional sale value in MDL
  description TEXT,                       -- optional product/deal description
  session_id  TEXT,                       -- optional link to the originating session
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS sales_date_idx ON sales (date);

ALTER TABLE sales ENABLE ROW LEVEL SECURITY;
-- No policies added: service_role bypasses RLS; all other roles are denied by default.
