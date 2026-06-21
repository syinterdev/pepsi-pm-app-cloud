-- 062 — ประวัติการสำรองฐานข้อมูล (Phase E — Administrator)
-- รัน: psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f database/migrations/062_tbl_backup_history.sql

BEGIN;

CREATE TABLE IF NOT EXISTS app.tbl_backup_history (
  id          bigserial PRIMARY KEY,
  "trigger"   varchar(16) NOT NULL,
  status      varchar(16) NOT NULL,
  size_bytes  bigint,
  file_path   text,
  sha256      text,
  duration_ms integer,
  started_by  text,
  started_at  timestamptz NOT NULL DEFAULT now(),
  finished_at timestamptz,
  error_text  text,
  CONSTRAINT tbl_backup_history_trigger_chk
    CHECK ("trigger" IN ('manual', 'schedule')),
  CONSTRAINT tbl_backup_history_status_chk
    CHECK (status IN ('running', 'success', 'failed'))
);

CREATE INDEX IF NOT EXISTS idx_tbl_backup_history_started_at
  ON app.tbl_backup_history (started_at DESC);

CREATE INDEX IF NOT EXISTS idx_tbl_backup_history_status
  ON app.tbl_backup_history (status);

COMMENT ON TABLE app.tbl_backup_history IS
  'ประวัติรัน pg_dump — manual หรือ schedule (Phase E admin backup)';

COMMIT;
