-- 008 — เมนูจาก DB (tbmenu) + สมาชิก (login-bk) + log สมาชิก
-- รัน: psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f database/migrations/008_auth_tbmenu_member.sql

CREATE TABLE IF NOT EXISTS app.tbmenu (
  idmenu       serial PRIMARY KEY,
  idmenusub    varchar(16) NOT NULL DEFAULT '0',
  menuon       integer     NOT NULL DEFAULT 0,
  menu_kind    varchar(8)  NOT NULL DEFAULT 'item' CHECK (menu_kind IN ('heading', 'item')),
  menuright    varchar(32) NOT NULL DEFAULT 'A',
  menuicon     varchar(64),
  menutitle    text        NOT NULL,
  menulink     text,
  react_route  text,
  menuname     varchar(64),
  menulavel    smallint    NOT NULL DEFAULT 1,
  end_exact    boolean     NOT NULL DEFAULT false
);

CREATE INDEX IF NOT EXISTS idx_tbmenu_parent ON app.tbmenu (idmenusub, menuon);

COMMENT ON TABLE app.tbmenu IS 'Legacy tbmenu — left_menu.php; react_route = path ใน React';

CREATE TABLE IF NOT EXISTS app.tbl_member (
  id         serial PRIMARY KEY,
  username   varchar(64) NOT NULL UNIQUE,
  password   text        NOT NULL,
  fullname   text,
  idcard     varchar(32),
  status     varchar(16) DEFAULT 'active',
  bank       text,
  bank_no    text,
  branch     text,
  last_login timestamptz
);

COMMENT ON TABLE app.tbl_member IS 'Legacy tbl_member — login-bk.php (flow สมาชิก)';

CREATE TABLE IF NOT EXISTS app.tbl_system_userlog (
  id         bigserial PRIMARY KEY,
  user_id    text        NOT NULL,
  username   text        NOT NULL,
  user_ip    text,
  my_ip      text,
  action     text        NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_tbl_system_userlog_created ON app.tbl_system_userlog (created_at DESC);

COMMENT ON TABLE app.tbl_system_userlog IS 'Legacy tbl_system_userlog — login-bk.php';

-- Seed เมนู (เทียบ nav-config.ts + left_menu_bk) — ลบก่อน insert ถ้ารันซ้ำใน dev
DELETE FROM app.tbmenu;

INSERT INTO app.tbmenu (idmenu, idmenusub, menuon, menu_kind, menuright, menuicon, menutitle, menulink, react_route, end_exact) VALUES
  (1,  '0', 10, 'heading', 'A:U:W', 'fa-chart-line', 'ปฏิทิน & ใบงาน', NULL, NULL, false),
  (2,  '0', 20, 'item',    'A:U:W', 'fa-home',       'Dashboard / หน้าแรก', 'index2.php', '/', true),
  (3,  '0', 30, 'item',    'A:U:W', 'fa-calendar',   'ปฏิทิน (Work scheduling)', 'index.php?module=calendar', '/calendar', false),
  (4,  '0', 40, 'item',    'A:U:W', 'fa-stream',     'ปฏิทินเส้น / Line', 'index.php?module=line_calendar', '/line-calendar', false),
  (5,  '0', 50, 'item',    'A:U:W', 'fa-list',       'Backlog / แผนค้าง', 'index.php?module=backlog', '/backlog', false),
  (6,  '0', 60, 'item',    'A:U:W', 'fa-clipboard',  'ใบงาน / WO', 'index2.php?module=workorder', '/work-orders', false),
  (7,  '0', 70, 'item',    'A:U:W', 'fa-check',      'รับรอง / Confirmation', 'index2.php?module=M_confirmation', '/confirmation', false),
  (10, '0', 100, 'heading', 'A',    'fa-wrench',     'แผน & นำเข้า SAP', NULL, NULL, false),
  (11, '0', 110, 'item',    'A',    'fa-project-diagram', 'แผน PM/CM', 'index2.php?module=M_planwork_view', '/planning', false),
  (12, '0', 120, 'item',    'A',    'fa-database',   'IW37N / นำเข้า SAP', 'index2.php?module=M_iw37n', '/iw37n', false),
  (13, '0', 130, 'item',    'A',    'fa-boxes',      'ข้อมูลหลัก (master)', 'index2.php?module=M_activitytype', '/master-data', false),
  (20, '0', 200, 'heading', 'A',   'fa-users',      'ชั่วโมง & บุคลากร', NULL, NULL, false),
  (21, '0', 210, 'item',    'A',    'fa-clock',      'Manhours', 'index2.php?module=M_manhour', '/manhours', false),
  (22, '0', 220, 'item',    'A:U:W', 'fa-hourglass', 'ดู Worktime ทั้งหมด', 'index2.php?module=W_worktime_view', '/worktime', false),
  (23, '0', 230, 'item',    'A',    'fa-user-friends','บุคลากร / ทีม', 'index2.php?module=M_personel', '/personnel', false),
  (30, '0', 300, 'heading', 'A',   'fa-chart-bar',  'รายงาน', NULL, NULL, false),
  (31, '0', 310, 'item',    'A',    'fa-chart-pie',  'รายงานรวม', 'index2.php?module=W_summary_weekly', '/reports', false),
  (32, '0', 320, 'item',    'A:U:W', 'fa-print',     'Manhour HR', 'index2.php?module=W_manhours_hr', '/manhours-hr', false),
  (33, '0', 330, 'item',    'A:U:W', 'fa-chart-line','สรุปรายสัปดาห์', 'index2.php?module=W_summary_weekly', '/summary-weekly', false),
  (40, '0', 400, 'heading', 'A',   'fa-cog',        'ระบบ', NULL, NULL, false),
  (41, '0', 410, 'item',    'A',    'fa-cog',        'ตั้งค่า', 'index2.php?module=user', '/settings', false);

SELECT setval(pg_get_serial_sequence('app.tbmenu', 'idmenu'), (SELECT COALESCE(MAX(idmenu), 1) FROM app.tbmenu));

-- ทดสอบ login-bk (รหัส plain — จะถูกอัปเกรดเป็น bcrypt หลัง login ครั้งแรก):
-- INSERT INTO app.tbl_member (username, password, fullname) VALUES ('demo', 'demo', 'Demo Member');
