-- 013 — เพิ่มคำอธิบายสถานะงาน (เทียบ M_workstatus.php)
-- รัน: psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f database/migrations/013_tbwkstatus_add_wkstreason.sql

ALTER TABLE app.tbwkstatus
  ADD COLUMN IF NOT EXISTS wkstreason text NOT NULL DEFAULT '';

UPDATE app.tbwkstatus
SET wkstreason = syst
WHERE wkstreason = '';
