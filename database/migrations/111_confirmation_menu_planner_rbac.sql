-- 111 — Confirmation page: single menu (Planner+) + QC/export RBAC for role U
-- รัน: psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f database/migrations/111_confirmation_menu_planner_rbac.sql

BEGIN;

-- ยุบ Personnel Confirmation → redirect ไป /confirmation (React)
DELETE FROM app.tbmenu
WHERE react_route = '/personnel/confirm'
   OR menulink = 'index2.php?module=M_personel_confirm';

UPDATE app.tbmenu
SET menutitle = 'Confirmation',
    menuright = 'A:U'
WHERE react_route = '/confirmation';

-- Planner: ตรวจปิดงาน (QC) + ส่งออก SAP
INSERT INTO app.tbl_role_permission (role_code, perm_code, granted)
VALUES
  ('U', 'confirmation.import', true),
  ('U', 'confirmation.export', true)
ON CONFLICT (role_code, perm_code) DO UPDATE SET granted = EXCLUDED.granted;

COMMIT;
