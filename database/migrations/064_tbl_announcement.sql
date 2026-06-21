-- 064 — ประกาศ / broadcast banner
-- รัน: psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f database/migrations/064_tbl_announcement.sql

CREATE TABLE IF NOT EXISTS app.tbl_announcement (
  id          serial PRIMARY KEY,
  level       varchar(16) NOT NULL DEFAULT 'info',
  title       text NOT NULL,
  body        text,
  starts_at   timestamptz NOT NULL DEFAULT now(),
  ends_at     timestamptz,
  dismissable boolean NOT NULL DEFAULT true,
  active      boolean NOT NULL DEFAULT true,
  created_by  text,
  created_at  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_tbl_announcement_active_time
  ON app.tbl_announcement (active, starts_at, ends_at);
