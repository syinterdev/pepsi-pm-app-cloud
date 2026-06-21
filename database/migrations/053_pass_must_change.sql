-- 053 — บังคับเปลี่ยนรหัสผ่านครั้งถัดไป (admin reset password)
-- รัน: psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f database/migrations/053_pass_must_change.sql

BEGIN;

ALTER TABLE app.tbworkcenter
  ADD COLUMN IF NOT EXISTS pass_must_change boolean NOT NULL DEFAULT false;

ALTER TABLE app.tbl_member
  ADD COLUMN IF NOT EXISTS pass_must_change boolean NOT NULL DEFAULT false;

COMMENT ON COLUMN app.tbworkcenter.pass_must_change IS
  'true หลัง admin reset password — บังคับเปลี่ยนรหัสที่ login ครั้งถัดไป';

COMMENT ON COLUMN app.tbl_member.pass_must_change IS
  'true หลัง admin reset password — บังคับเปลี่ยนรหัสที่ login ครั้งถัดไป';

COMMIT;
