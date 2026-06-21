-- 105 — ลบเมนู legacy `/personnel/admin` (ย้ายไป `/admin/users` แล้ว)
-- ป้องกัน sidebar แสดง label ผิดและ active state ไม่ตรง URL จริง

DELETE FROM app.tbmenu
WHERE react_route = '/personnel/admin';
