-- 086 — backfill WorkCntr (`wkctr`) เมื่อข้อมูล legacy/import ใส่ผิดคอลัมน์
-- WorkCntr = รหัสช่าง PAC/PRO/UTI (wkctr) · ไม่ใช่รหัส HR (idwkctr)
-- รัน: psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f database/migrations/086_backfill_wkctr.sql

-- 1) ข้อมูล import ผิด: WorkCntr ไปอยู่ surnamewkctr (เช่น idwkctr=PAC001, surnamewkctr=PAC010)
UPDATE app.tbworkcenter
SET wkctr = upper(trim(surnamewkctr))
WHERE coalesce(trim(wkctr), '') = ''
  AND trim(surnamewkctr) ~ '^(PAC|PRO|UTI)[0-9]{3}$';

-- 2) idwkctr เป็นรหัสช่างจริง แต่ wkctr ว่าง (เช่น idwkctr=UTI004)
UPDATE app.tbworkcenter
SET wkctr = upper(trim(idwkctr))
WHERE coalesce(trim(wkctr), '') = ''
  AND trim(idwkctr) ~ '^(PAC|PRO|UTI)[0-9]{3}$';

-- 3) wkctr = รหัส HR ผิด (เช่น ADMIN01) — ล้างถ้าไม่ใช่รูปแบบช่าง
UPDATE app.tbworkcenter
SET wkctr = ''
WHERE coalesce(trim(wkctr), '') <> ''
  AND NOT (trim(wkctr) ~ '^(PAC|PRO|UTI)[0-9]{3}$')
  AND wkctr = idwkctr;

-- 4) จับคู่ชื่อ-สกุลไทย (ซ้ำ 085 — idempotent)
UPDATE app.tbworkcenter SET wkctr = 'PAC007' WHERE trim(namewkctr) = 'พชรพรรณ' AND trim(surnamewkctr) = 'ชัยเนตร' AND coalesce(trim(wkctr),'') = '';
UPDATE app.tbworkcenter SET wkctr = 'PAC009' WHERE trim(namewkctr) = 'อนุวัฒน์' AND trim(surnamewkctr) = 'จันทร์ดี' AND coalesce(trim(wkctr),'') = '';
UPDATE app.tbworkcenter SET wkctr = 'PAC010' WHERE trim(namewkctr) IN ('กฤษฎิ์', 'Narit') AND trim(surnamewkctr) IN ('อนนท์', 'Anon') AND coalesce(trim(wkctr),'') = '';
UPDATE app.tbworkcenter SET wkctr = 'PAC011' WHERE trim(namewkctr) = 'เจษฎา' AND trim(surnamewkctr) = 'ปากกองวัน' AND coalesce(trim(wkctr),'') = '';
UPDATE app.tbworkcenter SET wkctr = 'PAC012' WHERE trim(namewkctr) = 'นพดล' AND trim(surnamewkctr) = 'จีดมั่น' AND coalesce(trim(wkctr),'') = '';
UPDATE app.tbworkcenter SET wkctr = 'PAC013' WHERE trim(namewkctr) = 'ออมทรัพย์' AND trim(surnamewkctr) = 'สกุลประกายพร' AND coalesce(trim(wkctr),'') = '';
UPDATE app.tbworkcenter SET wkctr = 'PAC014' WHERE trim(namewkctr) = 'ภูวดล' AND trim(surnamewkctr) = 'คนดี' AND coalesce(trim(wkctr),'') = '';
UPDATE app.tbworkcenter SET wkctr = 'PAC015' WHERE trim(namewkctr) = 'จักรพงษ์' AND trim(surnamewkctr) = 'กาบศรี' AND coalesce(trim(wkctr),'') = '';
UPDATE app.tbworkcenter SET wkctr = 'PRO007' WHERE trim(namewkctr) = 'จิรวัฒน์' AND trim(surnamewkctr) = 'ปันขันธ์' AND coalesce(trim(wkctr),'') = '';
UPDATE app.tbworkcenter SET wkctr = 'PRO008' WHERE trim(namewkctr) = 'จักรกริศน์' AND trim(surnamewkctr) = 'แสนขัติย์' AND coalesce(trim(wkctr),'') = '';
UPDATE app.tbworkcenter SET wkctr = 'PRO009' WHERE trim(namewkctr) = 'เอกนรินทร์' AND trim(surnamewkctr) = 'ไชยวงค์' AND coalesce(trim(wkctr),'') = '';
UPDATE app.tbworkcenter SET wkctr = 'PRO010' WHERE trim(namewkctr) IN ('สรรเสริญ', 'Sansurn') AND trim(surnamewkctr) IN ('จายนวล', 'Jaynoln') AND coalesce(trim(wkctr),'') = '';
UPDATE app.tbworkcenter SET wkctr = 'PRO011' WHERE trim(namewkctr) = 'ธวัชชัย' AND trim(surnamewkctr) = 'แก้วจันทร์' AND coalesce(trim(wkctr),'') = '';
UPDATE app.tbworkcenter SET wkctr = 'PRO013' WHERE trim(namewkctr) = 'รัชชานนท์' AND trim(surnamewkctr) = 'นนทะธรรม' AND coalesce(trim(wkctr),'') = '';
UPDATE app.tbworkcenter SET wkctr = 'PRO014' WHERE trim(namewkctr) = 'สมนึก' AND trim(surnamewkctr) = 'มงคลแก้ว' AND coalesce(trim(wkctr),'') = '';
UPDATE app.tbworkcenter SET wkctr = 'PRO015' WHERE trim(namewkctr) = 'เจษฎาพงศ์' AND trim(surnamewkctr) = 'ดวงแก้ว' AND coalesce(trim(wkctr),'') = '';
UPDATE app.tbworkcenter SET wkctr = 'PRO016' WHERE trim(namewkctr) = 'ยุทธการ' AND trim(surnamewkctr) = 'คาวิชา' AND coalesce(trim(wkctr),'') = '';
UPDATE app.tbworkcenter SET wkctr = 'PRO017' WHERE trim(namewkctr) IN ('ศรัล', 'Yotsaran') AND trim(surnamewkctr) IN ('แป้นเพชร', 'Panphet') AND coalesce(trim(wkctr),'') = '';
UPDATE app.tbworkcenter SET wkctr = 'PRO019' WHERE trim(namewkctr) = 'กฤษดา' AND trim(surnamewkctr) = 'รังสิตวัฒนะ' AND coalesce(trim(wkctr),'') = '';
UPDATE app.tbworkcenter SET wkctr = 'UTI004' WHERE trim(namewkctr) IN ('อานนท์', 'Anon', 'Arnon') AND trim(surnamewkctr) ILIKE '%สุริย%' AND coalesce(trim(wkctr),'') = '';
UPDATE app.tbworkcenter SET wkctr = 'UTI006' WHERE trim(namewkctr) IN ('กรณ์', 'Korn', 'Alongkorn') AND trim(surnamewkctr) ILIKE '%เที่ยง%' AND coalesce(trim(wkctr),'') = '';
UPDATE app.tbworkcenter SET wkctr = 'UTI007' WHERE trim(namewkctr) IN ('ภาณุวัช', 'Panuwat') AND trim(surnamewkctr) ILIKE '%ไชยช%' AND coalesce(trim(wkctr),'') = '';
UPDATE app.tbworkcenter SET wkctr = 'UTI008' WHERE trim(namewkctr) IN ('อภินันท์', 'Apinan', 'Surasak') AND trim(surnamewkctr) IN ('ถาคำ', 'Takhom', 'Surintham') AND coalesce(trim(wkctr),'') = '';
UPDATE app.tbworkcenter SET wkctr = 'UTI011' WHERE trim(namewkctr) IN ('ประพันธ์', 'Prapan') AND trim(surnamewkctr) ILIKE '%ผัด%' AND coalesce(trim(wkctr),'') = '';
UPDATE app.tbworkcenter SET wkctr = 'UTI012' WHERE trim(namewkctr) IN ('ณัฐวุฒิ', 'Nuttawoot', 'Nuttawau') AND trim(surnamewkctr) IN ('มีงิ้ว', 'Meengiu', 'MeeNgiw') AND coalesce(trim(wkctr),'') = '';
