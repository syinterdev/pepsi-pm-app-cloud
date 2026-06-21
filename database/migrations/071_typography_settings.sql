-- 071 — Typography (font family, size, colors) via Admin Branding
-- รัน: psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f database/migrations/071_typography_settings.sql

INSERT INTO app.tbl_setting (setting_key, setting_value, category, description, is_secret) VALUES
  ('app.font_family', '"sarabun"'::jsonb, 'branding', 'ฟอนต์หลักทั้งแอป', false),
  ('app.font_size_preset', '"comfortable"'::jsonb, 'branding', 'ขนาดตัวอักษร: compact|comfortable|large', false),
  ('app.font_size_base_px', 'null'::jsonb, 'branding', 'ขนาด px แทน preset (null = ใช้ preset)', false),
  ('app.font_color', 'null'::jsonb, 'branding', 'สีตัวอักษรหลัก (#RRGGBB หรือ null)', false),
  ('app.font_heading_color', 'null'::jsonb, 'branding', 'สีหัวข้อ (#RRGGBB หรือ null)', false),
  ('app.font_muted_color', 'null'::jsonb, 'branding', 'สีข้อความรอง (#RRGGBB หรือ null)', false)
ON CONFLICT (setting_key) DO NOTHING;
