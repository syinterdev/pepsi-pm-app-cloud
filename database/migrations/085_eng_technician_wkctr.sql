-- 085 — อัปเดตรหัสช่าง Engineering (WorkCntr) ตามลูกค้า
-- แหล่ง: docs from customer/Code ช่าง Eng.xls + UI Confirm ผู้ปฏิบัติงาน
-- รัน: psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f database/migrations/085_eng_technician_wkctr.sql

-- จับคู่ด้วยชื่อ-สกุลไทย (trim) แล้วตั้ง wkctr = PAC/PRO/UTI code
-- idwkctr ไม่เปลี่ยน — login เดิมยังใช้ได้

UPDATE app.tbworkcenter SET wkctr = 'PAC007'
WHERE trim(namewkctr) = 'พชรพรรณ' AND trim(surnamewkctr) = 'ชัยเนตร';

UPDATE app.tbworkcenter SET wkctr = 'PAC009' WHERE trim(namewkctr) = 'อนุวัฒน์' AND trim(surnamewkctr) = 'จันทร์ดี';

UPDATE app.tbworkcenter SET wkctr = 'PAC010' WHERE trim(namewkctr) IN ('กฤษฎิ์', 'Narit') AND trim(surnamewkctr) IN ('อนนท์', 'Anon');

UPDATE app.tbworkcenter SET wkctr = 'PAC011' WHERE trim(namewkctr) = 'เจษฎา' AND trim(surnamewkctr) = 'ปากกองวัน';

UPDATE app.tbworkcenter SET wkctr = 'PAC012' WHERE trim(namewkctr) = 'นพดล' AND trim(surnamewkctr) = 'จีดมั่น';

UPDATE app.tbworkcenter SET wkctr = 'PAC013' WHERE trim(namewkctr) = 'ออมทรัพย์' AND trim(surnamewkctr) = 'สกุลประกายพร';

UPDATE app.tbworkcenter SET wkctr = 'PAC014' WHERE trim(namewkctr) = 'ภูวดล' AND trim(surnamewkctr) = 'คนดี';

UPDATE app.tbworkcenter SET wkctr = 'PAC015' WHERE trim(namewkctr) = 'จักรพงษ์' AND trim(surnamewkctr) = 'กาบศรี';

UPDATE app.tbworkcenter SET wkctr = 'PRO007' WHERE trim(namewkctr) = 'จิรวัฒน์' AND trim(surnamewkctr) = 'ปันขันธ์';

UPDATE app.tbworkcenter SET wkctr = 'PRO008' WHERE trim(namewkctr) = 'จักรกริศน์' AND trim(surnamewkctr) = 'แสนขัติย์';

UPDATE app.tbworkcenter SET wkctr = 'PRO009' WHERE trim(namewkctr) = 'เอกนรินทร์' AND trim(surnamewkctr) = 'ไชยวงค์';

UPDATE app.tbworkcenter SET wkctr = 'PRO010' WHERE trim(namewkctr) IN ('สรรเสริญ', 'Sansurn') AND trim(surnamewkctr) IN ('จายนวล', 'Jaynoln');

UPDATE app.tbworkcenter SET wkctr = 'PRO011' WHERE trim(namewkctr) = 'ธวัชชัย' AND trim(surnamewkctr) = 'แก้วจันทร์';

UPDATE app.tbworkcenter SET wkctr = 'PRO013' WHERE trim(namewkctr) = 'รัชชานนท์' AND trim(surnamewkctr) = 'นนทะธรรม';

UPDATE app.tbworkcenter SET wkctr = 'PRO014' WHERE trim(namewkctr) = 'สมนึก' AND trim(surnamewkctr) = 'มงคลแก้ว';

UPDATE app.tbworkcenter SET wkctr = 'PRO015' WHERE trim(namewkctr) = 'เจษฎาพงศ์' AND trim(surnamewkctr) = 'ดวงแก้ว';

UPDATE app.tbworkcenter SET wkctr = 'PRO016' WHERE trim(namewkctr) = 'ยุทธการ' AND trim(surnamewkctr) = 'คาวิชา';

UPDATE app.tbworkcenter SET wkctr = 'PRO017' WHERE trim(namewkctr) IN ('ศรัล', 'Yotsaran') AND trim(surnamewkctr) IN ('แป้นเพชร', 'Panphet');

UPDATE app.tbworkcenter SET wkctr = 'PRO019' WHERE trim(namewkctr) = 'กฤษดา' AND trim(surnamewkctr) = 'รังสิตวัฒนะ';

UPDATE app.tbworkcenter SET wkctr = 'UTI004' WHERE trim(namewkctr) IN ('อานนท์', 'Anon', 'Arnon') AND trim(surnamewkctr) ILIKE '%สุริย%';

UPDATE app.tbworkcenter SET wkctr = 'UTI006' WHERE trim(namewkctr) IN ('กรณ์', 'Korn', 'Alongkorn') AND trim(surnamewkctr) ILIKE '%เที่ยง%';

UPDATE app.tbworkcenter SET wkctr = 'UTI007' WHERE trim(namewkctr) IN ('ภาณุวัช', 'Panuwat') AND trim(surnamewkctr) ILIKE '%ไชยช%';

UPDATE app.tbworkcenter SET wkctr = 'UTI008' WHERE trim(namewkctr) IN ('อภินันท์', 'Apinan', 'Surasak') AND trim(surnamewkctr) IN ('ถาคำ', 'Takhom', 'Surintham');

UPDATE app.tbworkcenter SET wkctr = 'UTI011' WHERE trim(namewkctr) IN ('ประพันธ์', 'Prapan') AND trim(surnamewkctr) ILIKE '%ผัด%';

UPDATE app.tbworkcenter SET wkctr = 'UTI012' WHERE trim(namewkctr) IN ('ณัฐวุฒิ', 'Nuttawoot', 'Nuttawau') AND trim(surnamewkctr) IN ('มีงิ้ว', 'Meengiu', 'MeeNgiw');

COMMENT ON COLUMN app.tbworkcenter.wkctr IS 'WorkCntr — รหัสช่าง Engineering (PAC/PRO/UTI) ใช้ใน Confirm และ tbwrkclose; ไม่ใช่รหัส HR (idwkctr)';
