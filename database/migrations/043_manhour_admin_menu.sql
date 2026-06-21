-- 043 — เมนู Admin จัดการ Man Hour (เทียบ M_manhour.php)
-- รัน: psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f database/migrations/043_manhour_admin_menu.sql

INSERT INTO app.tbmenu (
  idmenusub, menuon, menu_kind, menuright, menuicon,
  menutitle, menulink, react_route, menuname, menulavel, end_exact
)
SELECT '0', 233, 'item', 'A', 'fa-user-cog',
       'จัดการ Man Hour (Admin)', 'index2.php?module=M_manhour',
       '/manhours/admin', 'manhours-admin', 1, false
WHERE NOT EXISTS (
  SELECT 1 FROM app.tbmenu WHERE react_route = '/manhours/admin'
);

UPDATE app.tbmenu
SET menuright = 'A',
    menutitle = 'จัดการ Man Hour (Admin)',
    menuicon = 'fa-user-cog',
    menuon = 233
WHERE react_route = '/manhours/admin';

-- เมนู Manhours เดิม → สรุป chart (M_manhour_chart_performance)
UPDATE app.tbmenu
SET menutitle = 'Manhours (สรุป)',
    menulink = 'index2.php?module=M_manhour_chart_performance',
    react_route = '/manhours'
WHERE menuon = 210;

SELECT setval(
  pg_get_serial_sequence('app.tbmenu', 'idmenu'),
  (SELECT COALESCE(MAX(idmenu), 1) FROM app.tbmenu)
);
