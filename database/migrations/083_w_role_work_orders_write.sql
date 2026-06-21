-- 083 — Technician (W) ตั้งทีม WO ได้ — เทียบ workorder.php + AddTeam.php (menuright รวม W)
BEGIN;

INSERT INTO app.tbl_role_permission (role_code, perm_code, granted)
VALUES ('W', 'work-orders.write', true)
ON CONFLICT (role_code, perm_code) DO UPDATE SET granted = EXCLUDED.granted;

COMMIT;
