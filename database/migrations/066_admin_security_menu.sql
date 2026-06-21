-- 066 — เมนู sidebar "ความปลอดภัย" (/admin/security)
-- รัน: psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f database/migrations/066_admin_security_menu.sql

INSERT INTO app.tbmenu (
  idmenusub, menuon, menu_kind, menuright, menuicon,
  menutitle, menulink, react_route, menuname, menulavel, end_exact
)
SELECT '0', 357, 'item', 'A', 'fa-lock',
       'ความปลอดภัย', 'index2.php?module=admin_security',
       '/admin/security', 'admin-security', 1, false
WHERE NOT EXISTS (
  SELECT 1 FROM app.tbmenu WHERE react_route = '/admin/security'
);

UPDATE app.tbmenu
SET menuright = 'A',
    menutitle = 'ความปลอดภัย',
    menuicon = 'fa-lock',
    menuon = 357
WHERE react_route = '/admin/security';

SELECT setval(
  pg_get_serial_sequence('app.tbmenu', 'idmenu'),
  (SELECT COALESCE(MAX(idmenu), 1) FROM app.tbmenu)
);
