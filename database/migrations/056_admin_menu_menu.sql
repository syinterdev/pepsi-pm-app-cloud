-- 056 — เมนู sidebar "เมนู (Menu Builder)" (/admin/menu)
-- รัน: psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f database/migrations/056_admin_menu_menu.sql

INSERT INTO app.tbmenu (
  idmenusub, menuon, menu_kind, menuright, menuicon,
  menutitle, menulink, react_route, menuname, menulavel, end_exact
)
SELECT '0', 357, 'item', 'A', 'fa-bars',
       'เมนู (Menu Builder)', 'index2.php?module=admin_menu',
       '/admin/menu', 'admin-menu', 1, false
WHERE NOT EXISTS (
  SELECT 1 FROM app.tbmenu WHERE react_route = '/admin/menu'
);

UPDATE app.tbmenu
SET menuright = 'A',
    menutitle = 'เมนู (Menu Builder)',
    menuicon = 'fa-bars',
    menuon = 357
WHERE react_route = '/admin/menu';

SELECT setval(
  pg_get_serial_sequence('app.tbmenu', 'idmenu'),
  (SELECT COALESCE(MAX(idmenu), 1) FROM app.tbmenu)
);
