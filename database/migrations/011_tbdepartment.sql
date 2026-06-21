-- 011 — Department (เทียบ sap/pages/M_department.php → tbdepartment)
-- รัน: psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f database/migrations/011_tbdepartment.sql

CREATE TABLE IF NOT EXISTS app.tbdepartment (
  iddepartment  varchar(64) PRIMARY KEY,
  department    text NOT NULL
);

COMMENT ON TABLE app.tbdepartment IS 'Legacy tbdepartment — iddepartment, department (M_department.php)';

-- ข้อมูลตัวอย่าง (ลบได้ถ้ามีข้อมูลจริงจาก MySQL)
INSERT INTO app.tbdepartment (iddepartment, department)
VALUES
  ('DEP01', 'Maintenance'),
  ('DEP02', 'Production')
ON CONFLICT (iddepartment) DO NOTHING;
