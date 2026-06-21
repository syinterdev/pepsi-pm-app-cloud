-- 039 — tbwkctrstatus (personnel workstatus lookup) + seed (เทียบ legacy MySQL `tbwkctrstatus`)
-- รัน: psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f database/migrations/039_tbwkctrstatus.sql
--
-- ภาพรวม: ตารางนี้ใช้สำหรับ "สถานะการทำงานของบุคลากร" (workstatus ใน tbworkcenter)
--   - ต่างจาก app.tbwkstatus ที่เป็นสถานะ "ใบงาน" (SAP system status: CRTD/REL/CLSD)
--   - ใช้ใน M_personel.php (ฟิลด์ filed24 = "workstatus") และ user.php JOIN tbwkctrstatus
--   - is_active=true => บุคลากรนับว่ายังทำงานอยู่ (โผล่ใน planner autocomplete/filter default)
--   - is_active=false => บุคลากรลาออก/เกษียณ/พ้นสภาพ → ซ่อนใน list default แต่ยัง query ได้

BEGIN;

CREATE TABLE IF NOT EXISTS app.tbwkctrstatus (
  workstatus  varchar(16) PRIMARY KEY,
  wkstatusdes text        NOT NULL,
  wkstcolor   varchar(16),
  is_active   boolean     NOT NULL DEFAULT true,
  sort_order  integer     NOT NULL DEFAULT 0
);

COMMENT ON TABLE app.tbwkctrstatus
  IS 'Legacy tbwkctrstatus — ลูกอัปสำหรับ tbworkcenter.workstatus (M_personel.php / user.php JOIN)';

INSERT INTO app.tbwkctrstatus (workstatus, wkstatusdes, wkstcolor, is_active, sort_order) VALUES
  ('ACTIVE',     'ทำงานปกติ',              '#10b981',  true,  10),
  ('INACTIVE',   'ระงับใช้งาน (ชั่วคราว)', '#f59e0b',  true,  20),
  ('LEAVE',      'ลาพักงาน / Leave',       '#8b5cf6',  true,  30),
  ('RESIGNED',   'ลาออก',                  '#71717a',  false, 40),
  ('RETIRED',    'เกษียณ',                 '#3b82f6',  false, 50),
  ('TERMINATED', 'พ้นสภาพ',                '#ef4444',  false, 60)
ON CONFLICT (workstatus) DO NOTHING;

CREATE INDEX IF NOT EXISTS idx_tbworkcenter_workstatus ON app.tbworkcenter (workstatus);

COMMIT;
