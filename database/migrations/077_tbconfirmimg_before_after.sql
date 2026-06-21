-- 077 — รูปปิดงาน: Before / After + คำอธิบาย (เทียบ cimgcom ใน PHP)
-- รัน: psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f database/migrations/077_tbconfirmimg_before_after.sql

ALTER TABLE app.tbconfirmimg
  ADD COLUMN IF NOT EXISTS img_phase varchar(16) NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS img_comment text NOT NULL DEFAULT '';

COMMENT ON COLUMN app.tbconfirmimg.img_phase IS 'before | after (ว่าง = ข้อมูลเก่าก่อน migrate)';
COMMENT ON COLUMN app.tbconfirmimg.img_comment IS 'คำอธิบายประกอบรูป (เทียบ cimgcom)';

CREATE INDEX IF NOT EXISTS idx_tbconfirmimg_idiw37_phase
  ON app.tbconfirmimg (idiw37, img_phase);
