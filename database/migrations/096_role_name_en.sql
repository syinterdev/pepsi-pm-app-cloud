-- 096 — Bilingual role display names (TH in role_name, EN in role_name_en)
-- รัน: psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f database/migrations/096_role_name_en.sql

BEGIN;

ALTER TABLE app.tbl_role
  ADD COLUMN IF NOT EXISTS role_name_en text;

UPDATE app.tbl_role SET role_name_en = role_name WHERE role_name_en IS NULL OR TRIM(role_name_en) = '';

UPDATE app.tbl_role SET
  role_name = 'ผู้ดูแลระบบ',
  role_name_en = 'Administrator'
WHERE role_code = 'A';

UPDATE app.tbl_role SET
  role_name = 'ผู้จัดการ / หัวหน้างาน',
  role_name_en = 'Manager'
WHERE role_code = 'H';

UPDATE app.tbl_role SET
  role_name = 'Planner / Engineering',
  role_name_en = 'Planner'
WHERE role_code = 'U';

UPDATE app.tbl_role SET
  role_name = 'ช่าง',
  role_name_en = 'Technician'
WHERE role_code = 'W';

ALTER TABLE app.tbl_role
  ALTER COLUMN role_name_en SET NOT NULL;

COMMENT ON COLUMN app.tbl_role.role_name IS 'Role label (Thai) — shown when UI locale is th';
COMMENT ON COLUMN app.tbl_role.role_name_en IS 'Role label (English) — shown when UI locale is en';

COMMIT;
