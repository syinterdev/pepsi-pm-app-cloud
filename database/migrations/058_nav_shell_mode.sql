-- 058 — รูปแบบเมนูหลักของแอป (sidebar | navbar | hamburger)
-- รัน: psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f database/migrations/058_nav_shell_mode.sql

INSERT INTO app.tbl_setting (setting_key, setting_value, category, description, is_secret)
VALUES (
  'nav.shell_mode',
  '"sidebar"'::jsonb,
  'system',
  'รูปแบบเมนูหลัก: sidebar | navbar | hamburger — ตั้งจาก /admin/menu',
  false
)
ON CONFLICT (setting_key) DO UPDATE SET
  category = EXCLUDED.category,
  description = EXCLUDED.description;
