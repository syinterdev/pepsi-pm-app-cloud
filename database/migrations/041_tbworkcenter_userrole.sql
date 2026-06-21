-- 041 — explicit role enum สำหรับ tbworkcenter.userrole
-- เป้าหมาย: เลิกพึ่ง heuristic จาก position ใน Personal Dashboard และ Admin CRUD

BEGIN;

ALTER TABLE app.tbworkcenter
  ADD COLUMN IF NOT EXISTS userrole varchar(24);

-- ขยาย legacy UserST ให้รองรับ H (Head/Manager) ชัดเจน โดยยังคง A/U/W เดิมไว้
ALTER TABLE app.tbworkcenter
  DROP CONSTRAINT IF EXISTS tbworkcenter_userst_check;

ALTER TABLE app.tbworkcenter
  ADD CONSTRAINT tbworkcenter_userst_check
  CHECK (userst IS NULL OR userst IN ('A', 'H', 'U', 'W'));

ALTER TABLE app.tbworkcenter
  DROP CONSTRAINT IF EXISTS tbworkcenter_userrole_check;

ALTER TABLE app.tbworkcenter
  ADD CONSTRAINT tbworkcenter_userrole_check
  CHECK (
    userrole IS NULL
    OR userrole IN ('admin', 'manager', 'planner', 'technician')
  );

-- Backfill จากข้อมูลเดิม: explicit userst มาก่อน, position เป็นตัวช่วยเฉพาะ U/ว่าง
UPDATE app.tbworkcenter wc
SET userrole = CASE
  WHEN upper(coalesce(wc.userst, '')) = 'A' THEN 'admin'
  WHEN upper(coalesce(wc.userst, '')) = 'H' THEN 'manager'
  WHEN upper(coalesce(wc.userst, '')) = 'W' THEN 'technician'
  WHEN lower(coalesce(pos.position, '')) LIKE ANY (ARRAY[
    '%manager%',
    '%chief%',
    '%supervisor%',
    '%หัวหน้า%',
    '%ผู้จัดการ%',
    '%ผจก%'
  ]) THEN 'manager'
  WHEN lower(coalesce(pos.position, '')) LIKE ANY (ARRAY[
    '%technician%',
    '%mechanic%',
    '%ช่าง%'
  ]) THEN 'technician'
  ELSE 'planner'
END
FROM app.tbposition pos
WHERE pos.idposition::text = wc.idposition::text
  AND (wc.userrole IS NULL OR wc.userrole = '');

-- คนที่ไม่มี position match ให้ default ตาม userst
UPDATE app.tbworkcenter
SET userrole = CASE
  WHEN upper(coalesce(userst, '')) = 'A' THEN 'admin'
  WHEN upper(coalesce(userst, '')) = 'H' THEN 'manager'
  WHEN upper(coalesce(userst, '')) = 'W' THEN 'technician'
  ELSE 'planner'
END
WHERE userrole IS NULL OR userrole = '';

ALTER TABLE app.tbworkcenter
  ALTER COLUMN userrole SET DEFAULT 'planner';

ALTER TABLE app.tbworkcenter
  ALTER COLUMN userrole SET NOT NULL;

CREATE INDEX IF NOT EXISTS idx_tbworkcenter_userrole
  ON app.tbworkcenter (userrole);

COMMENT ON COLUMN app.tbworkcenter.userrole IS
  'Explicit application role: admin | manager | planner | technician. Replaces position-name heuristic for dashboards.';

COMMIT;
