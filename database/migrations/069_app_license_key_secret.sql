-- 069 — Example secret setting (masked in admin UI / audit)
-- รัน: psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f database/migrations/069_app_license_key_secret.sql

BEGIN;

INSERT INTO app.tbl_setting (setting_key, setting_value, category, description, is_secret)
VALUES (
  'app.license_key',
  'null'::jsonb,
  'system',
  'License key (แสดงเป็น •••• ใน Admin — ไม่ expose ใน public settings)',
  true
)
ON CONFLICT (setting_key) DO UPDATE SET
  is_secret = EXCLUDED.is_secret,
  description = EXCLUDED.description;

COMMIT;
