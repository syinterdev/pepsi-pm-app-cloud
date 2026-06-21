-- 068 — per-user UI preferences (theme, tours, density)
-- รัน: psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f database/migrations/068_tbl_user_pref.sql

BEGIN;

CREATE TABLE IF NOT EXISTS app.tbl_user_pref (
  user_id      text PRIMARY KEY,
  theme_mode   varchar(16),
  language     varchar(16),
  density      varchar(16),
  seen_tours   jsonb NOT NULL DEFAULT '{}'::jsonb,
  updated_at   timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE app.tbl_user_pref IS
  'Per-user UI prefs — theme, locale density, Joyride seen_tours keys (e.g. admin).';

COMMENT ON COLUMN app.tbl_user_pref.seen_tours IS
  'JSON map tour key → true, e.g. {"admin": true}';

COMMIT;
