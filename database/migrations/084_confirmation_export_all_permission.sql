-- 084 — Confirmation export scope via RBAC (แทน hardcode PAC007/PRO005)
-- รัน: psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f database/migrations/084_confirmation_export_all_permission.sql

BEGIN;

INSERT INTO app.tbl_permission (perm_code, perm_group, perm_name, description) VALUES
  (
    'confirmation.export.all',
    'confirmation',
    'ส่งออก Confirm ทุก Work Center',
    'เห็นและส่งออก confirmation ทุก wkctr (scope ALL) — กำหนดใน Admin → Roles'
  )
ON CONFLICT (perm_code) DO UPDATE SET
  perm_group = EXCLUDED.perm_group,
  perm_name = EXCLUDED.perm_name,
  description = EXCLUDED.description;

-- Admin: มีทุก permission อยู่แล้วจาก 046; ยืนยัน grant
INSERT INTO app.tbl_role_permission (role_code, perm_code, granted)
VALUES ('A', 'confirmation.export.all', true)
ON CONFLICT (role_code, perm_code) DO UPDATE SET granted = EXCLUDED.granted;

-- Manager (H): เทียบสิทธิ์ legacy ที่เห็นทุกแถว export
INSERT INTO app.tbl_role_permission (role_code, perm_code, granted)
VALUES ('H', 'confirmation.export.all', true)
ON CONFLICT (role_code, perm_code) DO UPDATE SET granted = EXCLUDED.granted;

COMMIT;
