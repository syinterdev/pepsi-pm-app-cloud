-- 030 — IW37N import row log (เทียบตารางผลรายแถวใน M_iw37n.php)
-- รัน: psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f database/migrations/030_tbiw37n_import_row.sql

CREATE TABLE IF NOT EXISTS app.tbiw37n_import_row (
  id         bigserial PRIMARY KEY,
  batch_id   bigint NOT NULL REFERENCES app.tbiw37n_import_batch (id) ON DELETE CASCADE,
  row_no     integer NOT NULL,
  action     varchar(16) NOT NULL,
  wkorder    varchar(64),
  opac       varchar(64),
  mntplan    varchar(128),
  wktype     varchar(64),
  mat        varchar(64),
  syst       varchar(32),
  message    text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_tbiw37n_import_row_uniq
ON app.tbiw37n_import_row (batch_id, row_no);

CREATE INDEX IF NOT EXISTS idx_tbiw37n_import_row_batch
ON app.tbiw37n_import_row (batch_id);
