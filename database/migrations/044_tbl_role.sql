-- 044 — RBAC role definitions (Phase A — Administrator module)
-- Maps legacy tbworkcenter.userst: A=Admin, H=Manager, U=Planner, W=Technician
-- รัน: psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f database/migrations/044_tbl_role.sql

BEGIN;

CREATE TABLE IF NOT EXISTS app.tbl_role (
  role_code   varchar(16) PRIMARY KEY,
  role_name   text NOT NULL,
  role_color  varchar(16) NOT NULL DEFAULT '#0A84FF',
  is_system   boolean NOT NULL DEFAULT false,
  description text,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE app.tbl_role IS
  'RBAC roles; role_code aligns with legacy userst (A/H/U/W) for session permission lookup.';

INSERT INTO app.tbl_role (role_code, role_name, role_color, is_system, description)
VALUES
  (
    'A',
    'ผู้ดูแลระบบ (Admin)',
    '#E11D48',
    true,
    'Full system access — maps to userst=A and userrole=admin'
  ),
  (
    'H',
    'ผู้จัดการ / หัวหน้างาน (Manager)',
    '#A855F7',
    true,
    'Oversight and operational write — maps to userst=H and userrole=manager'
  ),
  (
    'U',
    'Planner / Engineering',
    '#3B82F6',
    true,
    'Planning and SAP import scope — maps to userst=U and userrole=planner'
  ),
  (
    'W',
    'ช่าง (Technician)',
    '#10B981',
    true,
    'Field execution — maps to userst=W and userrole=technician'
  )
ON CONFLICT (role_code) DO UPDATE SET
  role_name = EXCLUDED.role_name,
  role_color = EXCLUDED.role_color,
  is_system = EXCLUDED.is_system,
  description = EXCLUDED.description,
  updated_at = now();

COMMIT;
