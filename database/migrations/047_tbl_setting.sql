-- 047 — System settings key/value store (Phase B — Administrator module)
-- Branding, locale, feature flags, backup defaults, maintenance mode
-- รัน: psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f database/migrations/047_tbl_setting.sql

BEGIN;

CREATE TABLE IF NOT EXISTS app.tbl_setting (
  setting_key   varchar(64) PRIMARY KEY,
  setting_value jsonb NOT NULL,
  category      varchar(32) NOT NULL,
  description   text,
  is_secret     boolean NOT NULL DEFAULT false,
  updated_by    text,
  updated_at    timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_tbl_setting_category ON app.tbl_setting (category);

COMMENT ON TABLE app.tbl_setting IS
  'Application settings (branding/system/feature/backup). Public subset exposed via GET /api/v1/settings/public.';

COMMENT ON COLUMN app.tbl_setting.setting_value IS
  'JSON value; logo/favicon binary uploaded via admin API may use base64 in jsonb or separate storage later.';

INSERT INTO app.tbl_setting (setting_key, setting_value, category, description, is_secret) VALUES
  ('app.name', '"PM Pepsi"'::jsonb, 'branding', 'ชื่อแอปใน topbar / document title', false),
  ('app.logo_bytes', 'null'::jsonb, 'branding', 'โลโก้ (WebP bytes as base64 json string when set)', false),
  ('app.logo_mime', 'null'::jsonb, 'branding', 'MIME ของโลโก้ เช่น image/webp', false),
  ('app.favicon_bytes', 'null'::jsonb, 'branding', 'Favicon override (base64 json when set)', false),
  ('app.footer_text', '"© S.Y. Interactive Development Limited"'::jsonb, 'branding', 'ข้อความ footer', false),
  ('app.primary_color', '"#FF3B30"'::jsonb, 'branding', 'สีหลัก Pepsi red — skills.md §Theme', false),
  ('app.accent_color', '"#007AFF"'::jsonb, 'branding', 'สี accent system blue', false),
  ('app.theme_mode', '"system"'::jsonb, 'branding', 'light | dark | system', false),

  ('app.locale', '"th-TH"'::jsonb, 'system', 'Locale BCP-47', false),
  ('app.timezone', '"Asia/Bangkok"'::jsonb, 'system', 'IANA timezone', false),
  ('app.year_format', '"BE"'::jsonb, 'system', 'BE หรือ AD สำหรับแสดงวันที่', false),
  ('app.date_format', '"dd/MM/yyyy"'::jsonb, 'system', 'รูปแบบวันที่', false),
  ('app.upload_max_mb', '15'::jsonb, 'system', 'ขนาดอัปโหลดสูงสุด (MB)', false),
  ('app.session_ttl_min', '480'::jsonb, 'system', 'อายุ session (นาที) — 8 ชม.', false),
  ('maintenance.enabled', 'false'::jsonb, 'system', 'โหมดบำรุงรักษา (readonly)', false),
  ('maintenance.message', '""'::jsonb, 'system', 'ข้อความ banner เมื่อ maintenance', false),

  ('feature.indexeddb_offline', 'false'::jsonb, 'feature', 'เปิด IndexedDB offline เมื่อพร้อม', false),
  ('feature.dashboard_charts', 'false'::jsonb, 'feature', 'เปิด dashboard charts ขั้นสูง', false),

  ('backup.schedule_cron', '"0 2 * * *"'::jsonb, 'backup', 'Cron สำรองอัตโนมัติ — ทุกวัน 02:00', false),
  ('backup.retention_days', '30'::jsonb, 'backup', 'เก็บไฟล์ backup (วัน)', false),
  ('backup.target_dir', '"D:/PM-Pepsi-App/backup"'::jsonb, 'backup', 'โฟลเดอร์ปลายทาง backup บน D:', false)
ON CONFLICT (setting_key) DO UPDATE SET
  setting_value = EXCLUDED.setting_value,
  category = EXCLUDED.category,
  description = EXCLUDED.description,
  is_secret = EXCLUDED.is_secret,
  updated_at = now();

COMMIT;
