-- 099 — Telegram notification groups + assignment ack + technician link fields
-- รัน: psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f database/migrations/099_telegram_notify.sql
--
-- Phase C (TELEGRAM-IMPLEMENTATION-CHECKLIST §C): Admin จัดการกลุ่มแจ้งเตือนเอง
-- Bot token เก็บใน env (TELEGRAM_BOT_TOKEN) — ไม่เก็บใน DB

BEGIN;

-- ── กลุ่มแจ้งเตือน (Planner / QC / custom) ──────────────────────────────────
CREATE TABLE IF NOT EXISTS app.tbl_telegram_notify_group (
  id               serial PRIMARY KEY,
  code             varchar(32) NOT NULL UNIQUE,
  name             text NOT NULL,
  notify_kind      varchar(32) NOT NULL,
  link_type        varchar(16) NOT NULL DEFAULT 'none',
  link_ref         varchar(64),
  telegram_chat_id bigint,
  enabled          boolean NOT NULL DEFAULT true,
  note             text,
  created_at       timestamptz NOT NULL DEFAULT now(),
  updated_at       timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_telegram_notify_group_kind
  ON app.tbl_telegram_notify_group (notify_kind);

CREATE INDEX IF NOT EXISTS idx_telegram_notify_group_enabled
  ON app.tbl_telegram_notify_group (enabled);

COMMENT ON TABLE app.tbl_telegram_notify_group IS
  'Admin-managed Telegram notification groups (ack_to_planner, confirm_reminder, custom, …)';

-- สมาชิก wkctr เมื่อ link_type = workcenters
CREATE TABLE IF NOT EXISTS app.tbl_telegram_notify_group_member (
  id        serial PRIMARY KEY,
  group_id  integer NOT NULL REFERENCES app.tbl_telegram_notify_group (id) ON DELETE CASCADE,
  wkctr     varchar(64) NOT NULL,
  UNIQUE (group_id, wkctr)
);

CREATE INDEX IF NOT EXISTS idx_telegram_notify_group_member_wkctr
  ON app.tbl_telegram_notify_group_member (wkctr);

-- ── ผูก Telegram รายช่าง ───────────────────────────────────────────────────
ALTER TABLE app.tbworkcenter
  ADD COLUMN IF NOT EXISTS telegram_chat_id   bigint,
  ADD COLUMN IF NOT EXISTS telegram_username  varchar(64),
  ADD COLUMN IF NOT EXISTS telegram_linked_at timestamptz;

COMMENT ON COLUMN app.tbworkcenter.telegram_chat_id IS
  'Telegram chat_id สำหรับ DM แจ้งงานจ่าย (1 wkctr = 1 chat)';

-- ── สถานะรับทราบงานจ่าย ─────────────────────────────────────────────────────
ALTER TABLE app.tbplangingwork
  ADD COLUMN IF NOT EXISTS ack_status   varchar(16) NOT NULL DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS ack_at       timestamptz,
  ADD COLUMN IF NOT EXISTS ack_channel  varchar(16);

COMMENT ON COLUMN app.tbplangingwork.ack_status IS
  'pending | acknowledged | declined (อนาคต)';

-- ── RBAC ─────────────────────────────────────────────────────────────────────
INSERT INTO app.tbl_permission (perm_code, perm_group, perm_name, description) VALUES
  ('admin.telegram.read',  'admin.telegram', 'ดู Telegram Admin', 'หน้า /admin/telegram'),
  ('admin.telegram.write', 'admin.telegram', 'จัดการ Telegram', 'CRUD กลุ่มแจ้งเตือน + ทดสอบส่ง')
ON CONFLICT (perm_code) DO NOTHING;

INSERT INTO app.tbl_role_permission (role_code, perm_code, granted)
SELECT 'A', p.perm_code, true
FROM app.tbl_permission p
WHERE p.perm_code IN ('admin.telegram.read', 'admin.telegram.write')
ON CONFLICT (role_code, perm_code) DO UPDATE SET granted = EXCLUDED.granted;

-- ── เมนู Admin ─────────────────────────────────────────────────────────────
INSERT INTO app.tbmenu (
  idmenusub, menuon, menu_kind, menuright, menuicon,
  menutitle, menulink, react_route, menuname, menulavel, end_exact
)
SELECT '0', 358, 'item', 'A', 'fa-paper-plane',
       'Telegram & การแจ้งเตือน', 'index2.php?module=admin_telegram',
       '/admin/telegram', 'admin-telegram', 1, false
WHERE NOT EXISTS (
  SELECT 1 FROM app.tbmenu WHERE react_route = '/admin/telegram'
);

UPDATE app.tbmenu
SET menuright = 'A',
    menutitle = 'Telegram & การแจ้งเตือน',
    menuicon = 'fa-paper-plane',
    menuon = 358
WHERE react_route = '/admin/telegram';

COMMIT;

SELECT setval(
  pg_get_serial_sequence('app.tbmenu', 'idmenu'),
  (SELECT COALESCE(MAX(idmenu), 1) FROM app.tbmenu)
);
