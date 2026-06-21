-- 103 — One-time codes for cross-app module handoff (store / repair)
-- รัน: psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f database/migrations/103_module_handoff.sql

BEGIN;

CREATE TABLE IF NOT EXISTS app.tbl_module_handoff_code (
  id              bigserial PRIMARY KEY,
  code_hash       char(64) NOT NULL UNIQUE,
  module_code     varchar(32) NOT NULL REFERENCES app.tbl_app_module (module_code),
  subject_type    varchar(16) NOT NULL,
  subject_id      text NOT NULL,
  username        text NOT NULL,
  userst          varchar(8) NOT NULL,
  issued_at       timestamptz NOT NULL DEFAULT now(),
  expires_at      timestamptz NOT NULL,
  consumed_at     timestamptz,
  consumed_by     text,
  issued_ip       inet,
  target_base_url text NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_handoff_expires
  ON app.tbl_module_handoff_code (expires_at)
  WHERE consumed_at IS NULL;

COMMENT ON TABLE app.tbl_module_handoff_code IS
  'One-time handoff codes for external module apps (store/repair). Stores SHA-256 hash only.';

COMMIT;
