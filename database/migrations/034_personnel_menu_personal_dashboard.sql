-- 034 — เปิดเมนู "Personal Dashboard" (/personnel) ให้ทุกสิทธิ์เห็น
-- เดิม seed 008 ใช้ menuright 'A' (Admin only) เพราะเทียบ `M_personel.php` (ตาราง personnel CRUD)
-- ใน React หน้านี้ถูกเปลี่ยนเป็น Personal Dashboard ของ user ปัจจุบัน (เห็นเฉพาะข้อมูลตัวเอง)
-- จึงควรเปิดให้ User / WorkCenter ใช้งานได้ด้วย — ตรงกับ `A:U:W`

UPDATE app.tbmenu
SET menuright = 'A:U:W',
    menutitle = 'Personal Dashboard'
WHERE menulink = 'index2.php?module=M_personel' AND react_route = '/personnel';

-- กรณีไม่มีแถว personel ใน tbmenu (เช่น run จาก seed ใหม่ที่ไม่ใส่แถวนี้) — แทรกให้ครบ
INSERT INTO app.tbmenu (
  idmenusub, menuon, menu_kind, menuright, menuicon,
  menutitle, menulink, react_route, menuname, menulavel, end_exact
)
SELECT '0', 230, 'item', 'A:U:W', 'fa-user-friends',
       'Personal Dashboard', 'index2.php?module=M_personel', '/personnel',
       'personnel', 1, false
WHERE NOT EXISTS (
  SELECT 1 FROM app.tbmenu
  WHERE menulink = 'index2.php?module=M_personel' AND react_route = '/personnel'
);

SELECT setval(
  pg_get_serial_sequence('app.tbmenu', 'idmenu'),
  (SELECT COALESCE(MAX(idmenu), 1) FROM app.tbmenu)
);
