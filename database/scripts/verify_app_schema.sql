-- ตรวจ schema app หลัง migration 001–026
-- รันใน DBeaver หรือ: psql "$DATABASE_URL" -f database/scripts/verify_app_schema.sql

\echo '=== 1) ตารางใน schema app ==='
SELECT table_name,
       CASE WHEN table_type = 'VIEW' THEN 'view' ELSE 'table' END AS kind
FROM information_schema.tables
WHERE table_schema = 'app'
ORDER BY kind, table_name;

\echo ''
\echo '=== 2) ตารางที่ต้องมี (migration 001–026) ==='
WITH expected(name) AS (
  VALUES
    ('tbworkcenter'),
    ('tbworkcenter_userlog'),
    ('tbactivitytype'),
    ('tbdepartment'),
    ('tblineschdul'),
    ('tbwkstatus'),
    ('tbiw37n'),
    ('tbmoveplan'),
    ('tbwkzb'),
    ('tbfunctional'),
    ('tbiw37n_import_batch'),
    ('tbplangingwork'),
    ('tbmenu'),
    ('tbl_member'),
    ('tbl_system_userlog'),
    ('tbreason'),
    ('tbmanhours'),
    ('tbequipment'),
    ('tbwkctrtype'),
    ('tbproductline'),
    ('tbzone'),
    ('tbmainteanance'),
    ('tbmaterial'),
    ('tbwklevel'),
    ('tbposition'),
    ('tbwkctrgroup'),
    ('tbtasklist'),
    ('tbcofirm'),
    ('tbiw37n_import_row')
),
views_expected(name) AS (
  VALUES ('view_order'), ('view_planwork'), ('view_confirmation')
)
SELECT e.name AS object_name,
       'table' AS expected_kind,
       EXISTS (
         SELECT 1 FROM information_schema.tables t
         WHERE t.table_schema = 'app' AND t.table_name = e.name AND t.table_type = 'BASE TABLE'
       ) AS ok
FROM expected e
UNION ALL
SELECT v.name, 'view',
       EXISTS (
         SELECT 1 FROM information_schema.views t
         WHERE t.table_schema = 'app' AND t.table_name = v.name
       )
FROM views_expected v
ORDER BY expected_kind, object_name;

\echo ''
\echo '=== 3) จำนวนแถวสำคัญ (หลัง seed) ==='
SELECT 'tbworkcenter' AS tbl, COUNT(*)::text AS n FROM app.tbworkcenter
UNION ALL SELECT 'tbmenu', COUNT(*)::text FROM app.tbmenu
UNION ALL SELECT 'tbiw37n', COUNT(*)::text FROM app.tbiw37n
UNION ALL SELECT 'tbwkstatus', COUNT(*)::text FROM app.tbwkstatus
UNION ALL SELECT 'tblineschdul', COUNT(*)::text FROM app.tblineschdul
UNION ALL SELECT 'tbactivitytype', COUNT(*)::text FROM app.tbactivitytype
UNION ALL SELECT 'tbdepartment', COUNT(*)::text FROM app.tbdepartment
UNION ALL SELECT 'tbwkzb', COUNT(*)::text FROM app.tbwkzb
UNION ALL SELECT 'tbfunctional', COUNT(*)::text FROM app.tbfunctional
UNION ALL SELECT 'tbl_member', COUNT(*)::text FROM app.tbl_member
UNION ALL SELECT 'tbmanhours', COUNT(*)::text FROM app.tbmanhours
UNION ALL SELECT 'tbequipment', COUNT(*)::text FROM app.tbequipment
UNION ALL SELECT 'tbwkctrtype', COUNT(*)::text FROM app.tbwkctrtype
UNION ALL SELECT 'tbproductline', COUNT(*)::text FROM app.tbproductline
UNION ALL SELECT 'tbzone', COUNT(*)::text FROM app.tbzone
UNION ALL SELECT 'tbmainteanance', COUNT(*)::text FROM app.tbmainteanance
UNION ALL SELECT 'tbmaterial', COUNT(*)::text FROM app.tbmaterial
UNION ALL SELECT 'tbwklevel', COUNT(*)::text FROM app.tbwklevel
UNION ALL SELECT 'tbposition', COUNT(*)::text FROM app.tbposition
UNION ALL SELECT 'tbwkctrgroup', COUNT(*)::text FROM app.tbwkctrgroup
UNION ALL SELECT 'tbtasklist', COUNT(*)::text FROM app.tbtasklist
UNION ALL SELECT 'tbl_role', COUNT(*)::text FROM app.tbl_role
UNION ALL SELECT 'tbl_permission', COUNT(*)::text FROM app.tbl_permission
UNION ALL SELECT 'tbl_role_permission', COUNT(*)::text FROM app.tbl_role_permission
UNION ALL SELECT 'tbl_setting', COUNT(*)::text FROM app.tbl_setting
UNION ALL SELECT 'tbl_audit_log', COUNT(*)::text FROM app.tbl_audit_log
ORDER BY tbl;

\echo ''
\echo '=== 4) ตัวอย่าง login (work center) ==='
SELECT idwkctr, wkctr, userst, plnt FROM app.tbworkcenter ORDER BY idwkctr LIMIT 5;

\echo ''
\echo '=== 5) Planning visibility by login work center ==='
SELECT
  wc.idwkctr,
  wc.wkctr,
  wc.userst,
  COUNT(vp.idiw37) FILTER (WHERE vp.syst IN ('CRTD', 'REL')) AS open_planning_orders,
  COUNT(vp.idiw37) FILTER (WHERE vp.syst NOT IN ('CRTD', 'REL')) AS closed_planning_orders,
  COUNT(vp.idiw37) AS total_planning_orders
FROM app.tbworkcenter wc
LEFT JOIN app.view_planwork vp ON vp.idwkctr = wc.idwkctr
GROUP BY wc.idwkctr, wc.wkctr, wc.userst
ORDER BY total_planning_orders DESC, wc.idwkctr
LIMIT 25;

\echo ''
\echo '=== 6) Planning rows with wkctr not mapped to tbworkcenter ==='
SELECT
  COALESCE(vp.wkctr, '(empty)') AS iw37n_wkctr,
  COUNT(*) AS rows_without_login_mapping
FROM app.view_planwork vp
WHERE vp.idwkctr IS NULL
GROUP BY COALESCE(vp.wkctr, '(empty)')
ORDER BY rows_without_login_mapping DESC, iw37n_wkctr
LIMIT 25;
