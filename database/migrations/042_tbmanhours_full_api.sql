-- 042 — ขยาย tbmanhours ให้ครบ legacy M_manhour* + API จริง
-- Legacy fields: idmanhour, idwkctr, stworkday, workday, wh, ot1, ot15, ot1hol, ot2, ot3

BEGIN;

ALTER TABLE app.tbmanhours
  ADD COLUMN IF NOT EXISTS stworkday bigint,
  ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();

-- migration 010 เดิมมีแค่ workday; backfill stworkday ให้เท่ากับ workday สำหรับข้อมูลเก่า
UPDATE app.tbmanhours
SET stworkday = workday
WHERE stworkday IS NULL;

ALTER TABLE app.tbmanhours
  ALTER COLUMN stworkday SET NOT NULL;

-- Legacy import เช็คซ้ำด้วย idwkctr + stworkday + workday
CREATE UNIQUE INDEX IF NOT EXISTS uq_tbmanhours_wkctr_period
  ON app.tbmanhours (idwkctr, stworkday, workday);

CREATE INDEX IF NOT EXISTS idx_tbmanhours_stworkday
  ON app.tbmanhours (stworkday);

CREATE INDEX IF NOT EXISTS idx_tbmanhours_period
  ON app.tbmanhours (stworkday, workday);

COMMENT ON COLUMN app.tbmanhours.stworkday IS
  'Legacy M_manhour.php start date (unix seconds at 00:00 Asia/Bangkok style).';

COMMENT ON COLUMN app.tbmanhours.workday IS
  'Legacy M_manhour.php end date (unix seconds at 00:00 Asia/Bangkok style).';

COMMIT;
