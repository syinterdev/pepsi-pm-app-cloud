-- 098 — 3 role หลัก: Admin / Planner / Technician
-- - Technician (W) ต้องมี planning.read สำหรับ /plan-calendar
-- - ย้าย legacy Manager (H) → Planner (U) ใน tbworkcenter
-- รัน: psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f database/migrations/098_three_primary_roles.sql

BEGIN;

INSERT INTO app.tbl_role_permission (role_code, perm_code, granted)
VALUES ('W', 'planning.read', true)
ON CONFLICT (role_code, perm_code) DO UPDATE SET granted = EXCLUDED.granted;

UPDATE app.tbl_role
SET
  description = 'Deprecated — migrated to Planner (U). Not shown in Admin UI.',
  updated_at = now()
WHERE role_code = 'H';

UPDATE app.tbworkcenter
SET userst = 'U', userrole = 'planner'
WHERE upper(trim(coalesce(userst, ''))) = 'H'
   OR lower(trim(coalesce(userrole, ''))) = 'manager';

COMMIT;

COMMENT ON TABLE app.tbl_role IS
  'RBAC roles; go-live uses A/U/W (Admin/Planner/Technician). H=deprecated Manager.';
