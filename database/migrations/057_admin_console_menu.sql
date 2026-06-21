-- 057 — เมนู sidebar "Admin Console" (/admin)
-- รัน: psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f database/migrations/057_admin_console_menu.sql

INSERT INTO app.tbmenu (
  idmenusub, menuon, menu_kind, menuright, menuicon,
  menutitle, menulink, react_route, menuname, menulavel, end_exact
)
SELECT '0', 354, 'item', 'A', 'fa-tachometer-alt',
       'Admin Console', 'index2.php?module=admin_console',
       '/admin', 'admin-console', 1, true
WHERE NOT EXISTS (
  SELECT 1 FROM app.tbmenu WHERE react_route = '/admin' AND end_exact = true
);

UPDATE app.tbmenu
SET menuright = 'A',
    menutitle = 'Admin Console',
    menuicon = 'fa-tachometer-alt',
    menuon = 354,
    end_exact = true
WHERE react_route = '/admin';

SELECT setval(
  pg_get_serial_sequence('app.tbmenu', 'idmenu'),
  (SELECT COALESCE(MAX(idmenu), 1) FROM app.tbmenu)
);
