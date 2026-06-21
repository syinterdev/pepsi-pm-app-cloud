-- 040 — เพิ่มเมนู "จัดการบุคลากร (Admin)" (M_personel.php — Admin CRUD) ใน tbmenu
-- รัน: psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f database/migrations/040_personnel_admin_menu.sql
--
-- ภาพรวม: เดิม legacy `M_personel.php` ตรงกับ idmenu=23 ใน seed 008 (menulink='index2.php?module=M_personel')
--   - หลัง migration 034 idmenu=23 ถูกเปลี่ยน react_route='/personnel' เป็น "Personal Dashboard" (user-facing)
--   - หน้า Admin CRUD ของ tbworkcenter ย้ายเป็น route ใหม่ '/personnel/admin' ใน React (PersonnelAdminPage.tsx)
--   - migration นี้แทรกแถวใหม่ใน tbmenu สำหรับ admin route นี้ (menuright='A') เพื่อให้ /api/v1/nav/menu คืนมาให้ sidebar
--
-- ลำดับ menuon ใน "ชั่วโมง & บุคลากร" group:
--   210 - Manhours
--   220 - Worktime
--   230 - /personnel (Personal Dashboard, A:U:W)        [via 034]
--   231 - /personnel/confirm (Personnel Confirmation, A)[via 037]
--   232 - /personnel/admin (จัดการบุคลากร Admin)         [นี้]

INSERT INTO app.tbmenu (
  idmenusub, menuon, menu_kind, menuright, menuicon,
  menutitle, menulink, react_route, menuname, menulavel, end_exact
)
SELECT '0', 232, 'item', 'A', 'fa-user-cog',
       'จัดการบุคลากร (Admin)', 'index2.php?module=M_personel&op=admin',
       '/personnel/admin', 'personnel-admin', 1, false
WHERE NOT EXISTS (
  SELECT 1 FROM app.tbmenu
  WHERE react_route = '/personnel/admin'
);

-- กัน drift: ถ้ามีแถวเดิม (รันซ้ำ) ให้ปรับสิทธิ์/ชื่อ/icon ให้ตรง spec ปัจจุบัน
UPDATE app.tbmenu
SET menuright = 'A',
    menutitle = 'จัดการบุคลากร (Admin)',
    menuicon  = 'fa-user-cog',
    menuon    = 232
WHERE react_route = '/personnel/admin';

SELECT setval(
  pg_get_serial_sequence('app.tbmenu', 'idmenu'),
  (SELECT COALESCE(MAX(idmenu), 1) FROM app.tbmenu)
);
