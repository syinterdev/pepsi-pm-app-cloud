-- 049 — เมนู sidebar "ตั้งค่าระบบ (System)" (/admin/settings)
-- รัน: psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f database/migrations/049_admin_settings_menu.sql
--
-- ลำดับ menuon ในกลุ่ม "ผู้ดูแลระบบ":
--   351 - /admin/branding (048)
--   352 - /admin/settings (นี้)

INSERT INTO app.tbmenu (
  idmenusub, menuon, menu_kind, menuright, menuicon,
  menutitle, menulink, react_route, menuname, menulavel, end_exact
)
SELECT '0', 352, 'item', 'A', 'fa-cogs',
       'ตั้งค่าระบบ (System)', 'index2.php?module=admin_settings',
       '/admin/settings', 'admin-settings', 1, false
WHERE NOT EXISTS (
  SELECT 1 FROM app.tbmenu WHERE react_route = '/admin/settings'
);

UPDATE app.tbmenu
SET menuright = 'A',
    menutitle = 'ตั้งค่าระบบ (System)',
    menuicon = 'fa-cogs',
    menuon = 352
WHERE react_route = '/admin/settings';

SELECT setval(
  pg_get_serial_sequence('app.tbmenu', 'idmenu'),
  (SELECT COALESCE(MAX(idmenu), 1) FROM app.tbmenu)
);
