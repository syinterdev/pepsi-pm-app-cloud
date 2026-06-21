-- 052 — เมนู sidebar "สุขภาพระบบ (Health)" (/admin/health)
-- รัน: psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f database/migrations/052_admin_health_menu.sql
--
-- ลำดับ menuon ในกลุ่ม "ผู้ดูแลระบบ":
--   353 - /admin/audit (051)
--   354 - /admin/health (นี้)

INSERT INTO app.tbmenu (
  idmenusub, menuon, menu_kind, menuright, menuicon,
  menutitle, menulink, react_route, menuname, menulavel, end_exact
)
SELECT '0', 354, 'item', 'A', 'fa-heartbeat',
       'สุขภาพระบบ (Health)', 'index2.php?module=admin_health',
       '/admin/health', 'admin-health', 1, false
WHERE NOT EXISTS (
  SELECT 1 FROM app.tbmenu WHERE react_route = '/admin/health'
);

UPDATE app.tbmenu
SET menuright = 'A',
    menutitle = 'สุขภาพระบบ (Health)',
    menuicon = 'fa-heartbeat',
    menuon = 354
WHERE react_route = '/admin/health';

SELECT setval(
  pg_get_serial_sequence('app.tbmenu', 'idmenu'),
  (SELECT COALESCE(MAX(idmenu), 1) FROM app.tbmenu)
);
