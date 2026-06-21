-- 102 — Module portal (login จุดเดียว · การ์ด PM / สโตร์อะไหล่ / แจ้งซ่อม)
-- รัน: psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f database/migrations/102_app_module_portal.sql

BEGIN;

INSERT INTO app.tbl_permission (perm_code, perm_group, perm_name, description) VALUES
  ('portal.view', 'portal', 'ดู Portal', 'หน้าเลือกระบบหลัง login'),
  ('module.pm', 'portal', 'เข้า PM Maintenance', 'แผนงาน · WO · Confirm'),
  ('module.store', 'portal', 'เข้าสโตร์อะไหล่', 'เบิกอะไหล่/วัสดุสำหรับช่าง (ซ่อม/PM)'),
  ('module.repair', 'portal', 'เข้าแจ้งซ่อม', 'ระบบแจ้งซ่อม / workflow งานซ่อม')
ON CONFLICT (perm_code) DO NOTHING;

CREATE TABLE IF NOT EXISTS app.tbl_app_module (
  module_code     varchar(32) PRIMARY KEY,
  perm_code       varchar(64) NOT NULL REFERENCES app.tbl_permission (perm_code),
  name_th         text NOT NULL,
  name_en         text NOT NULL,
  description_th  text,
  description_en  text,
  icon_key        varchar(32) NOT NULL DEFAULT 'box',
  accent_token    varchar(64),
  base_url        text NOT NULL DEFAULT '',
  entry_path      text,
  sort_order      int NOT NULL DEFAULT 0,
  is_active       boolean NOT NULL DEFAULT true,
  handoff_mode    varchar(32) NOT NULL DEFAULT 'none'
);

COMMENT ON TABLE app.tbl_app_module IS
  'Module cards on /portal — filtered by module.* permissions.';

INSERT INTO app.tbl_app_module (
  module_code, perm_code, name_th, name_en, description_th, description_en,
  icon_key, accent_token, base_url, entry_path, sort_order, handoff_mode
) VALUES
  (
    'pm', 'module.pm',
    'PM Maintenance', 'PM Maintenance',
    'แผนงาน · ใบงาน · Confirm · ปฏิทิน',
    'Planning · work orders · confirmation · calendar',
    'wrench', 'brand-pepsi-blue', '', NULL, 10, 'same_origin'
  ),
  (
    'store', 'module.store',
    'สโตร์อะไหล่', 'Spare Parts Store',
    'เบิกอะไหล่และวัสดุสำหรับช่าง — งานซ่อมและ PM',
    'Issue spare parts and materials for repair and PM work',
    'package', 'brand-pepsi-orange', '', NULL, 20, 'code_exchange'
  ),
  (
    'repair', 'module.repair',
    'แจ้งซ่อม', 'Repair Request',
    'แจ้งซ่อมและติดตามงานซ่อม',
    'Submit and track repair requests',
    'bell', 'brand-pepsi-green', '', NULL, 30, 'code_exchange'
  )
ON CONFLICT (module_code) DO UPDATE SET
  perm_code = EXCLUDED.perm_code,
  name_th = EXCLUDED.name_th,
  name_en = EXCLUDED.name_en,
  description_th = EXCLUDED.description_th,
  description_en = EXCLUDED.description_en,
  icon_key = EXCLUDED.icon_key,
  accent_token = EXCLUDED.accent_token,
  handoff_mode = EXCLUDED.handoff_mode,
  sort_order = EXCLUDED.sort_order;

INSERT INTO app.tbl_role_permission (role_code, perm_code, granted) VALUES
  ('A', 'portal.view', true),
  ('A', 'module.pm', true),
  ('A', 'module.store', true),
  ('A', 'module.repair', true),
  ('U', 'portal.view', true),
  ('U', 'module.pm', true),
  ('U', 'module.store', true),
  ('W', 'portal.view', true),
  ('W', 'module.pm', true)
ON CONFLICT (role_code, perm_code) DO UPDATE SET granted = EXCLUDED.granted;

COMMIT;
