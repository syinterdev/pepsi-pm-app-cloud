-- 054 — เมนู sidebar "จัดการผู้ใช้ (Users)" (/admin/users)
-- รัน: psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f database/migrations/054_admin_users_menu.sql

INSERT INTO app.tbmenu (
  idmenusub, menuon, menu_kind, menuright, menuicon,
  menutitle, menulink, react_route, menuname, menulavel, end_exact
)
SELECT '0', 355, 'item', 'A', 'fa-users-cog',
       'จัดการผู้ใช้ (Users)', 'index2.php?module=admin_users',
       '/admin/users', 'admin-users', 1, false
WHERE NOT EXISTS (
  SELECT 1 FROM app.tbmenu WHERE react_route = '/admin/users'
);

UPDATE app.tbmenu
SET menuright = 'A',
    menutitle = 'จัดการผู้ใช้ (Users)',
    menuicon = 'fa-users-cog',
    menuon = 355
WHERE react_route = '/admin/users';

SELECT setval(
  pg_get_serial_sequence('app.tbmenu', 'idmenu'),
  (SELECT COALESCE(MAX(idmenu), 1) FROM app.tbmenu)
);
