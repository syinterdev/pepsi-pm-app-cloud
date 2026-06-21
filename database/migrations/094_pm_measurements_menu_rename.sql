-- 094 — เปลี่ยนชื่อเมนู PM: เน้นกระแส 3 เฟส (ไม่ใช่ Vibration อย่างเดียว)
BEGIN;

UPDATE app.tbmenu
SET menutitle = 'PM ค่าวัด / กระแส 3 เฟส'
WHERE react_route = '/pm-vibration';

COMMIT;
