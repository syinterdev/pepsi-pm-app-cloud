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
  420,
  'item',
  'A:U:W',
  'fa-book',
  'User Log',
  'index2.php?module=M_UserLog',
  '/user-log',
  'M_UserLog',
  1,
  false
WHERE NOT EXISTS (
  SELECT 1 FROM app.tbmenu WHERE COALESCE(react_route, '') = '/user-log'
);
