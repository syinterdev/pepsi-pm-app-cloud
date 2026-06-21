-- 072 — Block IP (Administrator Security)
-- รัน: psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f database/migrations/072_tbl_blocked_ip.sql

BEGIN;

CREATE TABLE IF NOT EXISTS app.tbl_blocked_ip (
  id          serial PRIMARY KEY,
  ip          inet NOT NULL,
  reason      text,
  blocked_by  text NOT NULL,
  created_at  timestamptz NOT NULL DEFAULT now(),
  expires_at  timestamptz,
  CONSTRAINT tbl_blocked_ip_ip_unique UNIQUE (ip)
);

-- ไม่ใช้ partial index ที่มี now() ใน predicate — PostgreSQL 42P17 (now() ไม่ใช่ IMMUTABLE)
-- การค้นหา active block ใช้ UNIQUE (ip) + WHERE ใน SQL (blocked-ip service, cache 10s)

COMMENT ON TABLE app.tbl_blocked_ip IS
  'Blocked client IPs — enforced by blocked-ip middleware on /api/v1/*';

INSERT INTO app.tbl_permission (perm_code, perm_group, perm_name, description) VALUES
  ('admin.security.write', 'admin.security', 'จัดการความปลอดภัย', 'Block / unblock IP')
ON CONFLICT (perm_code) DO UPDATE SET
  perm_group = EXCLUDED.perm_group,
  perm_name = EXCLUDED.perm_name,
  description = EXCLUDED.description;

INSERT INTO app.tbl_role_permission (role_code, perm_code, granted)
SELECT 'A', 'admin.security.write', true
ON CONFLICT (role_code, perm_code) DO UPDATE SET granted = EXCLUDED.granted;

COMMIT;
