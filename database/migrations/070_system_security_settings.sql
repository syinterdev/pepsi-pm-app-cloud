-- 070 — Password policy + login attempt limits (System Settings §4.5)
-- รัน: psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f database/migrations/070_system_security_settings.sql

BEGIN;

INSERT INTO app.tbl_setting (setting_key, setting_value, category, description, is_secret) VALUES
  ('app.password_min_length', '12'::jsonb, 'system', 'ความยาวรหัสผ่านขั้นต่ำ (ตัวอักษร)', false),
  ('security.max_login_attempts', '5'::jsonb, 'system', 'จำนวนครั้ง login ผิดสูงสุดต่อ IP+ผู้ใช้ ใน 15 นาที', false)
ON CONFLICT (setting_key) DO UPDATE SET
  category = EXCLUDED.category,
  description = EXCLUDED.description,
  is_secret = EXCLUDED.is_secret,
  updated_at = now();

COMMIT;
