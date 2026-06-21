-- 050 — Audit trail (Phase C — Administrator module)
-- รัน: psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f database/migrations/050_tbl_audit_log.sql

BEGIN;

CREATE TABLE IF NOT EXISTS app.tbl_audit_log (
  id           bigserial PRIMARY KEY,
  actor_id     text,
  actor_role   varchar(16),
  action       varchar(64) NOT NULL,
  resource     varchar(64),
  resource_id  text,
  before_json  jsonb,
  after_json   jsonb,
  ip           inet,
  user_agent   text,
  status       varchar(16) NOT NULL DEFAULT 'ok',
  message      text,
  created_at   timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT tbl_audit_log_status_check
    CHECK (status IN ('ok', 'denied', 'error'))
);

CREATE INDEX IF NOT EXISTS idx_audit_actor_time
  ON app.tbl_audit_log (actor_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_audit_action_time
  ON app.tbl_audit_log (action, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_audit_resource
  ON app.tbl_audit_log (resource, resource_id);

CREATE INDEX IF NOT EXISTS idx_audit_created_at
  ON app.tbl_audit_log (created_at DESC);

COMMENT ON TABLE app.tbl_audit_log IS
  'Immutable audit trail for auth, mutations, RBAC denials — queried by /admin/audit.';

COMMENT ON COLUMN app.tbl_audit_log.action IS
  'Dot notation e.g. auth.login, planning.assign, admin.branding.update';

-- Retention default (days) — separate from backup.retention_days
INSERT INTO app.tbl_setting (setting_key, setting_value, category, description, is_secret)
VALUES ('audit.retention_days', '365'::jsonb, 'system', 'เก็บ audit log (วัน) ก่อน cleanup', false)
ON CONFLICT (setting_key) DO UPDATE SET
  setting_value = EXCLUDED.setting_value,
  category = EXCLUDED.category,
  description = EXCLUDED.description,
  updated_at = now();

COMMIT;
