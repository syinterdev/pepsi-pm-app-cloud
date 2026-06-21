-- 061 — ล็อกรูปแบบเมนูเป็น sidebar เท่านั้น (ไม่ใช้ navbar / hamburger)
-- รัน: psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f database/migrations/061_nav_shell_sidebar_only.sql

INSERT INTO app.tbl_setting (setting_key, setting_value, category, description, is_secret, updated_at)
VALUES (
  'nav.shell_mode',
  '"sidebar"'::jsonb,
  'system',
  'ล็อกรูปแบบเมนูเป็น sidebar เท่านั้น',
  false,
  NOW()
)
ON CONFLICT (setting_key) DO UPDATE
SET setting_value = '"sidebar"'::jsonb,
    category = 'system',
    updated_at = NOW();
