-- 108 — Master Plan (EE / ME / PK workbooks)

CREATE TABLE IF NOT EXISTS app.tb_master_plan_workbook (
  id              serial PRIMARY KEY,
  discipline      varchar(2) NOT NULL CHECK (discipline IN ('EE', 'ME', 'PK')),
  plan_year       integer NOT NULL DEFAULT 2026,
  source_filename varchar(255) NOT NULL,
  version_no      integer NOT NULL DEFAULT 1,
  status          varchar(16) NOT NULL DEFAULT 'published'
                    CHECK (status IN ('draft', 'published')),
  imported_at     timestamptz NOT NULL DEFAULT now(),
  imported_by     varchar(64),
  UNIQUE (discipline, plan_year, version_no)
);

CREATE TABLE IF NOT EXISTS app.tb_master_plan_sheet (
  id                   serial PRIMARY KEY,
  workbook_id          integer NOT NULL REFERENCES app.tb_master_plan_workbook (id) ON DELETE CASCADE,
  sheet_name           varchar(128) NOT NULL,
  sort_order           integer NOT NULL,
  title_rows_json      jsonb NOT NULL DEFAULT '[]'::jsonb,
  column_headers_json  jsonb NOT NULL DEFAULT '[]'::jsonb,
  header_row_index     integer,
  sheet_kind           varchar(16) NOT NULL DEFAULT 'detail'
                         CHECK (sheet_kind IN ('detail', 'summary', 'legend', 'reference')),
  UNIQUE (workbook_id, sheet_name)
);

CREATE INDEX IF NOT EXISTS idx_master_plan_sheet_workbook
  ON app.tb_master_plan_sheet (workbook_id, sort_order);

CREATE TABLE IF NOT EXISTS app.tb_master_plan_row (
  id           bigserial PRIMARY KEY,
  sheet_id     integer NOT NULL REFERENCES app.tb_master_plan_sheet (id) ON DELETE CASCADE,
  row_index    integer NOT NULL,
  cells_json   jsonb NOT NULL DEFAULT '{}'::jsonb,
  UNIQUE (sheet_id, row_index)
);

CREATE INDEX IF NOT EXISTS idx_master_plan_row_sheet
  ON app.tb_master_plan_row (sheet_id, row_index);
