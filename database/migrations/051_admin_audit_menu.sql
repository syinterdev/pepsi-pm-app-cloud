-- 051 — เมนู sidebar "บันทึกกิจกรรม (Audit)" (/admin/audit)
-- รัน: psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f database/migrations/051_admin_audit_menu.sql
--
-- ลำดับ menuon ในกลุ่ม "ผู้ดูแลระบบ":
--   351 - /admin/branding (048)
--   352 - /admin/settings (049)
--   353 - /admin/audit (นี้)

INSERT INTO app.tbmenu (
  idmenusub, menuon, menu_kind, menuright, menuicon,
  menutitle, menulink, react_route, menuname, menulavel, end_exact
)
SELECT '0', 353, 'item', 'A', 'fa-history',
       'บันทึกกิจกรรม (Audit)', 'index2.php?module=admin_audit',
       '/admin/audit', 'admin-audit', 1, false
WHERE NOT EXISTS (
  SELECT 1 FROM app.tbmenu WHERE react_route = '/admin/audit'
);

UPDATE app.tbmenu
SET menuright = 'A',
    menutitle = 'บันทึกกิจกรรม (Audit)',
    menuicon = 'fa-history',
    menuon = 353
WHERE react_route = '/admin/audit';

SELECT setval(
  pg_get_serial_sequence('app.tbmenu', 'idmenu'),
  (SELECT COALESCE(MAX(idmenu), 1) FROM app.tbmenu)
);
