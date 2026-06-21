-- 055 — เมนู sidebar "บทบาท & สิทธิ์ (Roles)" (/admin/roles)
-- รัน: psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f database/migrations/055_admin_roles_menu.sql

INSERT INTO app.tbmenu (
  idmenusub, menuon, menu_kind, menuright, menuicon,
  menutitle, menulink, react_route, menuname, menulavel, end_exact
)
SELECT '0', 356, 'item', 'A', 'fa-shield-alt',
       'บทบาท & สิทธิ์ (Roles)', 'index2.php?module=admin_roles',
       '/admin/roles', 'admin-roles', 1, false
WHERE NOT EXISTS (
  SELECT 1 FROM app.tbmenu WHERE react_route = '/admin/roles'
);

UPDATE app.tbmenu
SET menuright = 'A',
    menutitle = 'บทบาท & สิทธิ์ (Roles)',
    menuicon = 'fa-shield-alt',
    menuon = 356
WHERE react_route = '/admin/roles';

SELECT setval(
  pg_get_serial_sequence('app.tbmenu', 'idmenu'),
  (SELECT COALESCE(MAX(idmenu), 1) FROM app.tbmenu)
);
