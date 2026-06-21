-- 115 — PM Work Order Page 2 snapshot (Comments and Findings footer fields)
-- รัน: psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f database/migrations/115_wo_pm_page2.sql

CREATE TABLE IF NOT EXISTS app.tbwo_pm_page2 (
  idiw37                  integer PRIMARY KEY REFERENCES app.tbiw37n (idiw37) ON DELETE CASCADE,
  activity_report_wkctr   varchar(64),
  completed_by_name       varchar(256),
  closed_date             date,
  equipment_ok            varchar(1) CHECK (equipment_ok IS NULL OR equipment_ok IN ('Y', 'N')),
  signature_planner_name  varchar(256),
  signature_at            timestamptz,
  signature_action        varchar(16) CHECK (
    signature_action IS NULL OR signature_action IN ('approved', 'rejected')
  ),
  updated_at              timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE app.tbwo_pm_page2 IS
  'WO Page 2 snapshot — Activity/Completed/Date จาก personnel-close · Signature จาก Confirm QC · Equipment Y/N manual';
