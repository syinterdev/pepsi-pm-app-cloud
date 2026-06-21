-- 010 — ชั่วโมงทำงาน (เทียบ sap tbmanhours + worktime_count.php)
-- รัน: psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f database/migrations/010_tbmanhours.sql

CREATE TABLE IF NOT EXISTS app.tbmanhours (
  idmanhour   bigserial PRIMARY KEY,
  idwkctr     varchar(64) NOT NULL REFERENCES app.tbworkcenter (idwkctr) ON DELETE CASCADE,
  workday     bigint      NOT NULL,
  wh          numeric(10, 2) NOT NULL DEFAULT 0,
  ot1         numeric(10, 2) NOT NULL DEFAULT 0,
  ot15        numeric(10, 2) NOT NULL DEFAULT 0,
  ot1hol      numeric(10, 2) NOT NULL DEFAULT 0,
  ot2         numeric(10, 2) NOT NULL DEFAULT 0,
  ot3         numeric(10, 2) NOT NULL DEFAULT 0,
  created_at  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_tbmanhours_idwkctr ON app.tbmanhours (idwkctr);
CREATE INDEX IF NOT EXISTS idx_tbmanhours_workday ON app.tbmanhours (workday);

COMMENT ON TABLE app.tbmanhours IS 'Legacy tbmanhours — wh/OT hours per work center per day (unix workday)';
