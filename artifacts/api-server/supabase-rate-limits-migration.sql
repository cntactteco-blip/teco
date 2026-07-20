-- Migration: create ip_rate_limits table + atomic increment function
-- Run this in your Supabase project → SQL Editor

CREATE TABLE IF NOT EXISTS ip_rate_limits (
  ip        TEXT    NOT NULL,
  date      DATE    NOT NULL,
  type      TEXT    NOT NULL,   -- 'visitor' | 'chat-notify' | etc.
  count     INTEGER NOT NULL DEFAULT 1,
  PRIMARY KEY (ip, date, type)
);

-- Index for cleanup queries (optional, table stays small — only one row per IP/day/type)
CREATE INDEX IF NOT EXISTS ip_rate_limits_date_idx ON ip_rate_limits (date);

ALTER TABLE ip_rate_limits ENABLE ROW LEVEL SECURITY;
-- No policies added: service_role bypasses RLS; all other roles are denied by default.

-- ─── Atomic increment function ────────────────────────────────────────────────
-- Increments the counter for (ip, date, type) atomically using INSERT … ON CONFLICT
-- and returns the NEW count after the increment.  The caller decides whether the
-- returned count exceeds the allowed limit.
CREATE OR REPLACE FUNCTION increment_ip_rate_limit(
  p_ip   TEXT,
  p_date DATE,
  p_type TEXT
) RETURNS INTEGER LANGUAGE plpgsql SECURITY DEFINER AS $
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
$;
