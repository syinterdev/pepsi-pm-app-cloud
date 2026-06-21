-- 048 — เมนู sidebar "ผู้ดูแลระบบ" + ธีม & โลโก้ (/admin/branding)
-- รัน: psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f database/migrations/048_admin_branding_menu.sql
--
-- ลำดับ menuon (ระหว่าง "รายงาน" ~300 กับ "ระบบ" ~400):
--   350 - heading ผู้ดูแลระบบ (A)
--   351 - /admin/branding (A)

INSERT INTO app.tbmenu (
  idmenusub, menuon, menu_kind, menuright, menuicon,
  menutitle, menulink, react_route, menuname, menulavel, end_exact
)
SELECT '0', 350, 'heading', 'A', 'fa-shield-alt',
       'ผู้ดูแลระบบ', NULL, NULL, 'admin-heading', 0, false
WHERE NOT EXISTS (
  SELECT 1 FROM app.tbmenu
  WHERE menu_kind = 'heading' AND menutitle = 'ผู้ดูแลระบบ'
);

INSERT INTO app.tbmenu (
  idmenusub, menuon, menu_kind, menuright, menuicon,
  menutitle, menulink, react_route, menuname, menulavel, end_exact
)
SELECT '0', 351, 'item', 'A', 'fa-palette',
       'ธีม & โลโก้ (Branding)', 'index2.php?module=admin_branding',
       '/admin/branding', 'admin-branding', 1, false
WHERE NOT EXISTS (
  SELECT 1 FROM app.tbmenu WHERE react_route = '/admin/branding'
);

UPDATE app.tbmenu
SET menuright = 'A',
    menutitle = 'ผู้ดูแลระบบ',
    menuon = 350,
    menu_kind = 'heading'
WHERE menu_kind = 'heading' AND menutitle = 'ผู้ดูแลระบบ';

UPDATE app.tbmenu
SET menuright = 'A',
    menutitle = 'ธีม & โลโก้ (Branding)',
    menuicon = 'fa-palette',
    menuon = 351
WHERE react_route = '/admin/branding';

SELECT setval(
  pg_get_serial_sequence('app.tbmenu', 'idmenu'),
  (SELECT COALESCE(MAX(idmenu), 1) FROM app.tbmenu)
);
