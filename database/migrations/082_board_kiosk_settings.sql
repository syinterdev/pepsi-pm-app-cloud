-- 082 — Engineering Board kiosk (TV ไม่ต้อง login ซ้ำ)
BEGIN;

INSERT INTO app.tbl_setting (setting_key, setting_value, category, description, is_secret) VALUES
  ('board.kiosk_enabled', 'true'::jsonb, 'feature', 'เปิด /board ด้วย kiosk token (หรือ session)', false),
  ('board.kiosk_token', 'null'::jsonb, 'feature', 'Token อ่านอย่างเดียวสำหรับ TV — rotate จาก Admin', true)
ON CONFLICT (setting_key) DO UPDATE SET
  category = EXCLUDED.category,
  description = EXCLUDED.description,
  is_secret = EXCLUDED.is_secret,
  updated_at = now();

COMMIT;
