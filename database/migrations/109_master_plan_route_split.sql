-- 109 — Split Master Plan (/master-plan) from SAP reference tables (/master-data)

UPDATE app.tbmenu
SET react_route = '/master-plan',
    menutitle = 'Master Plan',
    menuname = COALESCE(NULLIF(menuname, ''), 'master-plan')
WHERE react_route = '/master-data'
  AND menutitle IN ('Master Plan', 'ข้อมูลหลัก (master)');

INSERT INTO app.tbmenu (
  idmenusub, menuon, menu_kind, menuright, menuicon,
  menutitle, menulink, react_route, menuname, menulavel, end_exact
)
SELECT '0', 131, 'item', 'A', 'fa-database',
       'Master Data (SAP)', 'index2.php?module=M_activitytype',
       '/master-data', 'master-data-sap', 1, false
WHERE NOT EXISTS (
  SELECT 1 FROM app.tbmenu WHERE react_route = '/master-data'
);

SELECT setval(
  pg_get_serial_sequence('app.tbmenu', 'idmenu'),
  (SELECT COALESCE(MAX(idmenu), 1) FROM app.tbmenu)
);
