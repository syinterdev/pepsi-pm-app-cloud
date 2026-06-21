-- 113 — Vibration Dst/dB: v3 ไม่ใช้ (nullable) · v1=Dst · v2=dB
-- รัน: psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f database/migrations/113_pm_reading_vibration_v3_null.sql

BEGIN;

ALTER TABLE app.tbwo_pm_reading
  ALTER COLUMN v3 DROP NOT NULL;

-- Legacy vibration rows saved with v3=0 placeholder → NULL
UPDATE app.tbwo_pm_reading
SET v3 = NULL
WHERE kind = 'vibration_3axis' AND v3 = 0;

COMMENT ON COLUMN app.tbwo_pm_reading.v1 IS
  'current_3phase: เฟส R (A) · vibration_3axis: Dst (Distortion)';
COMMENT ON COLUMN app.tbwo_pm_reading.v2 IS
  'current_3phase: เฟส S (A) · vibration_3axis: dB (Lev)';
COMMENT ON COLUMN app.tbwo_pm_reading.v3 IS
  'current_3phase: เฟส T (A) · vibration_3axis: NULL (ไม่ใช้)';

COMMIT;
