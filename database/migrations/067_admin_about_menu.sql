-- 067 — เมนู sidebar "เกี่ยวกับระบบ" (/admin/about)
-- รัน: psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f database/migrations/067_admin_about_menu.sql

INSERT INTO app.tbmenu (
  idmenusub, menuon, menu_kind, menuright, menuicon,
  menutitle, menulink, react_route, menuname, menulavel, end_exact
)
SELECT '0', 358, 'item', 'A', 'fa-info-circle',
       'เกี่ยวกับระบบ', 'index2.php?module=admin_about',
       '/admin/about', 'admin-about', 1, false
WHERE NOT EXISTS (
  SELECT 1 FROM app.tbmenu WHERE react_route = '/admin/about'
);

UPDATE app.tbmenu
SET menuright = 'A',
    menutitle = 'เกี่ยวกับระบบ',
    menuicon = 'fa-info-circle',
    menuon = 358
WHERE react_route = '/admin/about';

SELECT setval(
  pg_get_serial_sequence('app.tbmenu', 'idmenu'),
  (SELECT COALESCE(MAX(idmenu), 1) FROM app.tbmenu)
);
