-- 035 — ขยาย app.tbworkcenter ให้รองรับ field ครบของ M_personel.php + เก็บภาพประจำตัวเป็น WebP ใน DB
-- เทียบ PHP `M_personel.php` (filed1..filed25) + flow upload ที่ย่อขนาด 600px แล้วเขียนเป็น JPEG
-- เปลี่ยน policy: เก็บ binary ลง bytea (WebP) เพื่อประหยัด storage และง่ายต่อ backup
-- รัน: psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f database/migrations/035_tbworkcenter_full_personnel_columns.sql

ALTER TABLE app.tbworkcenter
  ADD COLUMN IF NOT EXISTS cat              varchar(64),
  ADD COLUMN IF NOT EXISTS resp             varchar(64),
  ADD COLUMN IF NOT EXISTS idwklevel        varchar(64),
  ADD COLUMN IF NOT EXISTS wkctrtel         varchar(32),
  ADD COLUMN IF NOT EXISTS wkctrmail        varchar(255),
  ADD COLUMN IF NOT EXISTS labourcost       numeric(12, 2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS imgmember_data   bytea,
  ADD COLUMN IF NOT EXISTS imgmember_mime   varchar(32) NOT NULL DEFAULT 'image/webp',
  ADD COLUMN IF NOT EXISTS imgmember_bytes  integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS updated_at       timestamptz NOT NULL DEFAULT now();

COMMENT ON COLUMN app.tbworkcenter.cat IS 'PHP M_personel.php filed13 — category';
COMMENT ON COLUMN app.tbworkcenter.resp IS 'PHP M_personel.php filed14 — responsibility';
COMMENT ON COLUMN app.tbworkcenter.idwklevel IS 'PHP M_personel.php filed17 — FK tbwklevel.idwklevel';
COMMENT ON COLUMN app.tbworkcenter.wkctrtel IS 'PHP M_personel.php filed19 — โทรศัพท์';
COMMENT ON COLUMN app.tbworkcenter.wkctrmail IS 'PHP M_personel.php filed20 — อีเมล';
COMMENT ON COLUMN app.tbworkcenter.labourcost IS 'PHP M_personel.php filed21 — ต้นทุนต่อคน';
COMMENT ON COLUMN app.tbworkcenter.imgmember_data IS 'รูปประจำตัวเก็บใน DB เป็น WebP (resize 600px กว้าง) — เทียบ /imgMember/.<filename>';
COMMENT ON COLUMN app.tbworkcenter.imgmember_mime IS 'ค่าเริ่ม image/webp — ใช้ติด Content-Type ตอนส่งไฟล์';
COMMENT ON COLUMN app.tbworkcenter.imgmember_bytes IS 'ขนาดไฟล์ WebP เป็น bytes';
