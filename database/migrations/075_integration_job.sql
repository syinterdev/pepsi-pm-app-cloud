-- 075 — SAP CSV integration jobs + batch source (Phase 3 watch folder)
-- รัน: psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f database/migrations/075_integration_job.sql

BEGIN;

ALTER TABLE app.tbiw37n_import_batch
  ADD COLUMN IF NOT EXISTS source varchar(16) NOT NULL DEFAULT 'manual';

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'tbiw37n_import_batch_source_chk'
  ) THEN
    ALTER TABLE app.tbiw37n_import_batch
      ADD CONSTRAINT tbiw37n_import_batch_source_chk
      CHECK (source IN ('manual', 'sap_folder', 'api'));
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS app.integration_job (
  id            bigserial PRIMARY KEY,
  job_type      varchar(32) NOT NULL,
  status        varchar(16) NOT NULL,
  trigger_mode  varchar(16) NOT NULL,
  file_path     text,
  file_name     text,
  sha256        char(64),
  batch_id      bigint REFERENCES app.tbiw37n_import_batch (id) ON DELETE SET NULL,
  summary       jsonb NOT NULL DEFAULT '{}'::jsonb,
  error_text    text,
  started_by    text,
  started_at    timestamptz NOT NULL DEFAULT now(),
  finished_at   timestamptz,
  CONSTRAINT integration_job_type_chk
    CHECK (job_type IN ('iw37n_in_scan')),
  CONSTRAINT integration_job_status_chk
    CHECK (status IN ('running', 'success', 'failed', 'partial')),
  CONSTRAINT integration_job_trigger_chk
    CHECK (trigger_mode IN ('manual', 'schedule'))
);

CREATE INDEX IF NOT EXISTS idx_integration_job_started_at
  ON app.integration_job (started_at DESC);

CREATE INDEX IF NOT EXISTS idx_integration_job_status
  ON app.integration_job (status);

COMMENT ON TABLE app.integration_job IS
  'SAP CSV folder watch / manual scan jobs (doc 15 phase 3)';

INSERT INTO app.tbl_permission (perm_code, perm_group, perm_name, description)
VALUES
  ('integration.admin', 'integration', 'จัดการ SAP CSV Integration', 'ดูโฟลเดอร์ · รัน watch job')
ON CONFLICT (perm_code) DO NOTHING;

INSERT INTO app.tbl_role_permission (role_code, perm_code, granted)
VALUES ('A', 'integration.admin', true)
ON CONFLICT (role_code, perm_code) DO UPDATE SET granted = EXCLUDED.granted;

INSERT INTO app.tbl_role_permission (role_code, perm_code, granted)
VALUES ('U', 'integration.admin', true)
ON CONFLICT (role_code, perm_code) DO UPDATE SET granted = EXCLUDED.granted;

INSERT INTO app.tbl_setting (setting_key, setting_value, category, updated_by)
VALUES
  ('integration.watch_enabled', 'true'::jsonb, 'integration', 'migration'),
  ('integration.watch_interval_minutes', '10'::jsonb, 'integration', 'migration')
ON CONFLICT (setting_key) DO NOTHING;

COMMIT;
