-- Phase C (lite): Maintenance plan / calendar revision trail for auditor
CREATE TABLE IF NOT EXISTS app.tbl_resource_revision (
  id            bigserial PRIMARY KEY,
  resource_type varchar(32) NOT NULL,
  resource_id   varchar(64) NOT NULL,
  revision_no   int NOT NULL,
  actor_id      varchar(64),
  actor_role    varchar(32),
  change_kind   varchar(32) NOT NULL,
  before_json   jsonb,
  after_json    jsonb,
  created_at    timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_revision_resource
  ON app.tbl_resource_revision (resource_type, resource_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_revision_created
  ON app.tbl_resource_revision (created_at DESC);
