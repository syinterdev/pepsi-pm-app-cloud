-- 002 — Activity Type (เทียบ sap/pages/M_activitytype.php → tbactivitytype)
-- รัน: psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f database/migrations/002_tbactivitytype.sql

CREATE TABLE IF NOT EXISTS app.tbactivitytype (
  mat         varchar(64) PRIMARY KEY,
  matdescrip  text,
  matcheck    varchar(64)
);

COMMENT ON TABLE app.tbactivitytype IS 'Legacy tbactivitytype — mat, matdescrip, matcheck (M_activitytype.php)';

-- ข้อมูลตัวอย่าง (ลบได้ถ้ามีข้อมูลจริงจาก MySQL)
INSERT INTO app.tbactivitytype (mat, matdescrip, matcheck)
VALUES
  ('PM01', 'Preventive Maintenance', 'Y'),
  ('CM01', 'Corrective Maintenance', 'Y')
ON CONFLICT (mat) DO NOTHING;
