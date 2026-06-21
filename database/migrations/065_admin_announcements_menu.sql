-- 065 — เมนู sidebar "ประกาศ" (/admin/announcements)
-- รัน: psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f database/migrations/065_admin_announcements_menu.sql

INSERT INTO app.tbmenu (
  idmenusub, menuon, menu_kind, menuright, menuicon,
  menutitle, menulink, react_route, menuname, menulavel, end_exact
)
SELECT '0', 356, 'item', 'A', 'fa-bullhorn',
       'ประกาศ', 'index2.php?module=admin_announcements',
       '/admin/announcements', 'admin-announcements', 1, false
WHERE NOT EXISTS (
  SELECT 1 FROM app.tbmenu WHERE react_route = '/admin/announcements'
);

UPDATE app.tbmenu
SET menuright = 'A',
    menutitle = 'ประกาศ',
    menuicon = 'fa-bullhorn',
    menuon = 356
WHERE react_route = '/admin/announcements';

SELECT setval(
  pg_get_serial_sequence('app.tbmenu', 'idmenu'),
  (SELECT COALESCE(MAX(idmenu), 1) FROM app.tbmenu)
);
