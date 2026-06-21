-- 114 — rename kind vibration_3axis → vibration_dst_db (Dst/dB)
-- รัน: psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f database/migrations/114_pm_reading_kind_vibration_dst_db.sql

UPDATE app.tbwo_pm_reading
SET kind = 'vibration_dst_db'
WHERE kind = 'vibration_3axis';

ALTER TABLE app.tbwo_pm_reading
  DROP CONSTRAINT IF EXISTS tbwo_pm_reading_kind_check;

ALTER TABLE app.tbwo_pm_reading
  ADD CONSTRAINT tbwo_pm_reading_kind_check
  CHECK (kind IN ('current_3phase', 'vibration_dst_db'));

COMMENT ON COLUMN app.tbwo_pm_reading.v1 IS
  'current_3phase: เฟส R (A) · vibration_dst_db: Dst (Distortion)';
COMMENT ON COLUMN app.tbwo_pm_reading.v2 IS
  'current_3phase: เฟส S (A) · vibration_dst_db: dB (Lev)';
COMMENT ON COLUMN app.tbwo_pm_reading.v3 IS
  'current_3phase: เฟส T (A) · vibration_dst_db: NULL (ไม่ใช้)';
