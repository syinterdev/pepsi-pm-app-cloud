-- 006 — ประวัติการนำเข้า IW37N (เทียบ flow M_iw37n.php)
-- รัน: psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f database/migrations/006_tbiw37n_import_batch.sql

CREATE TABLE IF NOT EXISTS app.tbiw37n_import_batch (
  id               bigserial PRIMARY KEY,
  file_name        text        NOT NULL,
  sha256           char(64)    NOT NULL,
  imported_at      timestamptz NOT NULL DEFAULT now(),
  row_count        integer     NOT NULL DEFAULT 0,
  inserted_count   integer     NOT NULL DEFAULT 0,
  updated_count    integer     NOT NULL DEFAULT 0,
  skipped_count    integer     NOT NULL DEFAULT 0,
  status           varchar(16) NOT NULL DEFAULT 'OK'
);

CREATE INDEX IF NOT EXISTS idx_tbiw37n_import_batch_imported_at
  ON app.tbiw37n_import_batch (imported_at DESC);

COMMENT ON TABLE app.tbiw37n_import_batch IS 'IW37N import history — React /api/v1/iw37n/batches';
