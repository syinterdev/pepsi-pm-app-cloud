-- 046 — Default RBAC grants per legacy role (A/H/U/W)
-- A = all permissions; H/U/W = subsets aligned with menuright ในระบบเดิม
-- รัน: psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f database/migrations/046_tbl_role_permission.sql

BEGIN;

CREATE TABLE IF NOT EXISTS app.tbl_role_permission (
  role_code   varchar(16) NOT NULL REFERENCES app.tbl_role(role_code) ON DELETE CASCADE,
  perm_code   varchar(64) NOT NULL REFERENCES app.tbl_permission(perm_code) ON DELETE CASCADE,
  granted     boolean NOT NULL DEFAULT true,
  PRIMARY KEY (role_code, perm_code)
);

CREATE INDEX IF NOT EXISTS idx_tbl_role_permission_perm ON app.tbl_role_permission (perm_code);

COMMENT ON TABLE app.tbl_role_permission IS
  'Role × permission matrix; hasPermission() joins session userst to role_code.';

-- Admin (A): ทุก permission
INSERT INTO app.tbl_role_permission (role_code, perm_code, granted)
SELECT 'A', p.perm_code, true
FROM app.tbl_permission p
ON CONFLICT (role_code, perm_code) DO UPDATE SET granted = EXCLUDED.granted;

-- Manager (H): อ่านทุกโมดูลธุรกิจ + เขียนด้านปฏิบัติการ/รายงาน (ไม่มี admin.*)
INSERT INTO app.tbl_role_permission (role_code, perm_code, granted)
SELECT 'H', p.perm_code, true
FROM app.tbl_permission p
WHERE p.perm_group NOT IN ('admin', 'admin.users', 'admin.roles', 'admin.menu', 'admin.branding',
  'admin.settings', 'admin.audit', 'admin.backup', 'admin.health', 'admin.security',
  'admin.announcement', 'admin.about')
  AND p.perm_code NOT IN (
    'planning.assign',
    'planning.delete',
    'work-orders.delete',
    'work-orders.import',
    'iw37n.import',
    'iw37n.write',
    'master-data.write',
    'master-data.delete',
    'master-data.import',
    'personnel.write',
    'personnel.import',
    'personnel.delete',
    'manhours.admin',
    'manhours.import',
    'manhours.delete',
    'confirmation.import'
  )
ON CONFLICT (role_code, perm_code) DO UPDATE SET granted = EXCLUDED.granted;

-- Planner (U): แผน + WO + IW37N + master read + ปฏิทิน/backlog
INSERT INTO app.tbl_role_permission (role_code, perm_code, granted)
SELECT 'U', v.perm_code, true
FROM (
  VALUES
    ('dashboard.read'),
    ('calendar.read'),
    ('calendar.write'),
    ('backlog.read'),
    ('backlog.write'),
    ('planning.read'),
    ('planning.write'),
    ('planning.assign'),
    ('planning.delete'),
    ('work-orders.read'),
    ('work-orders.write'),
    ('work-orders.import'),
    ('work-orders.export'),
    ('confirmation.read'),
    ('personnel.read'),
    ('master-data.read'),
    ('iw37n.read'),
    ('iw37n.write'),
    ('iw37n.import'),
    ('iw37n.export'),
    ('reports.read'),
    ('manhours.read'),
    ('user-log.read')
) AS v(perm_code)
ON CONFLICT (role_code, perm_code) DO UPDATE SET granted = EXCLUDED.granted;

-- Technician (W): ปฏิทิน/backlog/WO/confirm/manhour ระดับปฏิบัติการ
INSERT INTO app.tbl_role_permission (role_code, perm_code, granted)
SELECT 'W', v.perm_code, true
FROM (
  VALUES
    ('dashboard.read'),
    ('calendar.read'),
    ('backlog.read'),
    ('work-orders.read'),
    ('confirmation.read'),
    ('confirmation.write'),
    ('confirmation.close'),
    ('personnel.read'),
    ('manhours.read'),
    ('manhours.write'),
    ('reports.read'),
    ('user-log.read')
) AS v(perm_code)
ON CONFLICT (role_code, perm_code) DO UPDATE SET granted = EXCLUDED.granted;

COMMIT;
