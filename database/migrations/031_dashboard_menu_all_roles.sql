-- 031 — Dashboard menu visible for all roles (A/U/W)
-- รัน: psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f database/migrations/031_dashboard_menu_all_roles.sql

UPDATE app.tbmenu
SET
  menutitle = 'Dashboard / หน้าแรก',
  menuright = 'A:U:W',
  menuicon = COALESCE(menuicon, 'fa-home'),
  end_exact = true
WHERE COALESCE(react_route, '') = '/';

INSERT INTO app.tbmenu (
  idmenusub,
  menuon,
  menu_kind,
  menuright,
  menuicon,
  menutitle,
  menulink,
  react_route,
  menuname,
  menulavel,
  end_exact
)
SELECT
  '0',
  20,
  'item',
  'A:U:W',
  'fa-home',
  'Dashboard / หน้าแรก',
  'index2.php',
  '/',
  'dashboard',
  1,
  true
WHERE NOT EXISTS (
  SELECT 1 FROM app.tbmenu WHERE COALESCE(react_route, '') = '/'
);
