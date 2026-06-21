-- 080 — Admin QC ก่อนนับปิดงานใน dashboard / Personnel Confirm / workflow step 4
-- รัน: psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f database/migrations/080_tbiw37n_confirm_qc.sql

ALTER TABLE app.tbiw37n
  ADD COLUMN IF NOT EXISTS confirm_qc_status varchar(16),
  ADD COLUMN IF NOT EXISTS confirm_qc_at timestamptz,
  ADD COLUMN IF NOT EXISTS confirm_qc_by varchar(64),
  ADD COLUMN IF NOT EXISTS confirm_qc_note text;

COMMENT ON COLUMN app.tbiw37n.confirm_qc_status IS 'pending | approved | rejected — Admin ตรวจก่อนอัปเดต dashboard';
COMMENT ON COLUMN app.tbiw37n.confirm_qc_at IS 'เวลาที่ Admin อนุมัติ/ปฏิเสธ';
COMMENT ON COLUMN app.tbiw37n.confirm_qc_by IS 'wkctr/username ผู้ตรวจ';
COMMENT ON COLUMN app.tbiw37n.confirm_qc_note IS 'หมายเหตุเมื่อปฏิเสธหรืออนุมัติ';

CREATE INDEX IF NOT EXISTS idx_tbiw37n_confirm_qc_pending
  ON app.tbiw37n (bscstart DESC NULLS LAST)
  WHERE confirm_qc_status = 'pending';

-- ข้อมูลเก่าที่มีชุดปิดงานแล้ว → ถือว่าผ่าน QC แล้ว
UPDATE app.tbiw37n i
SET confirm_qc_status = 'approved',
    confirm_qc_at = COALESCE(confirm_qc_at, NOW()),
    confirm_qc_by = COALESCE(NULLIF(TRIM(confirm_qc_by), ''), 'migration')
WHERE COALESCE(confirm_qc_status, '') = ''
  AND (
    EXISTS (SELECT 1 FROM app.tbcofirm c WHERE c.idiw37 = i.idiw37)
    OR EXISTS (SELECT 1 FROM app.tbconfirmimg img WHERE img.idiw37 = i.idiw37)
    OR EXISTS (
      SELECT 1 FROM app.tbwrkclose w WHERE w.idiw37 = i.idiw37
    )
  );
