-- 079 — รูปปิดงานใน DB (BYTEA) — เลิกใช้ uploads/confirm-images เป็นแหล่งจริง
-- รัน: psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f database/migrations/079_tbconfirmimg_img_data.sql

ALTER TABLE app.tbconfirmimg
  ADD COLUMN IF NOT EXISTS img_data BYTEA;

COMMENT ON COLUMN app.tbconfirmimg.img_data IS 'WebP ใน DB — แหล่งจริงหลัง migrate 079';
COMMENT ON COLUMN app.tbconfirmimg.mime IS 'MIME ของ img_data (มัก image/webp)';
COMMENT ON COLUMN app.tbconfirmimg.cfilename IS 'ชื่ออ้างอิง legacy / ไฟล์บนดิสก์ก่อนย้าย — ไม่บังคับเมื่อมี img_data';

CREATE INDEX IF NOT EXISTS idx_tbconfirmimg_has_data
  ON app.tbconfirmimg (idiw37)
  WHERE img_data IS NOT NULL AND octet_length(img_data) > 0;
