-- 110 — Master Plan cell edit changelog (Phase 2 B1)
-- รัน: psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f database/migrations/110_master_plan_change.sql

CREATE TABLE IF NOT EXISTS app.tb_master_plan_change (
  id           bigserial PRIMARY KEY,
  row_id       bigint NOT NULL
                 REFERENCES app.tb_master_plan_row (id) ON DELETE CASCADE,
  sheet_id     integer NOT NULL
                 REFERENCES app.tb_master_plan_sheet (id) ON DELETE CASCADE,
  change_type  varchar(16) NOT NULL DEFAULT 'update'
                 CHECK (change_type IN ('create', 'update', 'delete', 'import', 'publish')),
  field_name   varchar(128),
  before_json  jsonb,
  after_json   jsonb,
  changed_by   varchar(64) NOT NULL,
  changed_at   timestamptz NOT NULL DEFAULT now(),
  comment      text
);

COMMENT ON TABLE app.tb_master_plan_change IS
  'Master Plan edit history — one row per cell change (field_name set) or whole-row event (field_name null).';

COMMENT ON COLUMN app.tb_master_plan_change.sheet_id IS
  'Denormalized from tb_master_plan_row for sheet-level changelog queries.';

COMMENT ON COLUMN app.tb_master_plan_change.field_name IS
  'Column header key from column_headers_json; null = whole-row change (import/publish/delete).';

CREATE INDEX IF NOT EXISTS idx_master_plan_change_sheet_time
  ON app.tb_master_plan_change (sheet_id, changed_at DESC);

CREATE INDEX IF NOT EXISTS idx_master_plan_change_row_time
  ON app.tb_master_plan_change (row_id, changed_at DESC);

CREATE INDEX IF NOT EXISTS idx_master_plan_change_type_time
  ON app.tb_master_plan_change (change_type, changed_at DESC);
