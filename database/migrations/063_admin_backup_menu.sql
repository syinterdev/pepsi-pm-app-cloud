-- 063 — เมนู sidebar "สำรอง & กู้คืน" (/admin/backup)
-- รัน: psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f database/migrations/063_admin_backup_menu.sql

INSERT INTO app.tbmenu (
  idmenusub, menuon, menu_kind, menuright, menuicon,
  menutitle, menulink, react_route, menuname, menulavel, end_exact
)
SELECT '0', 355, 'item', 'A', 'fa-database',
       'สำรอง & กู้คืน', 'index2.php?module=admin_backup',
       '/admin/backup', 'admin-backup', 1, false
WHERE NOT EXISTS (
  SELECT 1 FROM app.tbmenu WHERE react_route = '/admin/backup'
);

UPDATE app.tbmenu
SET menuright = 'A',
    menutitle = 'สำรอง & กู้คืน',
    menuicon = 'fa-database',
    menuon = 355
WHERE react_route = '/admin/backup';

SELECT setval(
  pg_get_serial_sequence('app.tbmenu', 'idmenu'),
  (SELECT COALESCE(MAX(idmenu), 1) FROM app.tbmenu)
);
