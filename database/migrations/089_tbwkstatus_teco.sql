-- 089 — เพิ่มสถานะ TECO ใน tbwkstatus สำหรับตัวกรอง "สถานะระบบ"
-- รัน: psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f database/migrations/089_tbwkstatus_teco.sql

INSERT INTO app.tbwkstatus (syst, wkstcolor, wkstreason)
VALUES ('TECO', '#16a34a', 'งานที่ถูกปิดแล้ว')
ON CONFLICT (syst) DO UPDATE
SET wkstreason = EXCLUDED.wkstreason,
    wkstcolor = EXCLUDED.wkstcolor;
