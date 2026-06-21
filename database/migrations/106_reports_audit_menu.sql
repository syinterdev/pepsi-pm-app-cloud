-- 106 — Reports sibling routes: /reports/audit, /activity-log + exact match for /reports
-- แก้ sidebar active และให้เมนูจาก tbmenu ตรงกับ React routes

UPDATE app.tbmenu
SET end_exact = true,
    menuright = 'A:U:W'
WHERE react_route = '/reports';

INSERT INTO app.tbmenu (
  idmenusub, menuon, menu_kind, menuright, menuicon,
  menutitle, menulink, react_route, menuname, menulavel, end_exact
)
SELECT '0', 315, 'item', 'A:U:W', 'fa-shield-alt',
       'Auditor Hub', NULL, '/reports/audit', 'reports-audit', 1, false
WHERE NOT EXISTS (
  SELECT 1 FROM app.tbmenu WHERE react_route = '/reports/audit'
);

INSERT INTO app.tbmenu (
  idmenusub, menuon, menu_kind, menuright, menuicon,
  menutitle, menulink, react_route, menuname, menulavel, end_exact
)
SELECT '0', 316, 'item', 'A:U:W', 'fa-book',
       'Activity Log', NULL, '/activity-log', 'activity-log', 1, false
WHERE NOT EXISTS (
  SELECT 1 FROM app.tbmenu WHERE react_route = '/activity-log'
);

SELECT setval(
  pg_get_serial_sequence('app.tbmenu', 'idmenu'),
  (SELECT COALESCE(MAX(idmenu), 1) FROM app.tbmenu)
);
