-- 076 — CONFIRM_IN folder scan job types (doc 15 phase 4)
-- รัน: psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f database/migrations/076_integration_confirm_in.sql

BEGIN;

ALTER TABLE app.integration_job
  DROP CONSTRAINT IF EXISTS integration_job_type_chk;

ALTER TABLE app.integration_job
  ADD CONSTRAINT integration_job_type_chk
  CHECK (job_type IN ('iw37n_in_scan', 'confirm_in_scan', 'inbound_scan'));

COMMENT ON TABLE app.integration_job IS
  'SAP CSV folder watch — IW37N + CONFIRM_IN inbound (doc 15)';

COMMIT;
