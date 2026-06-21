-- 045 — RBAC permission catalog (~64 codes)
-- รัน: psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f database/migrations/045_tbl_permission.sql

BEGIN;

CREATE TABLE IF NOT EXISTS app.tbl_permission (
  perm_code   varchar(64) PRIMARY KEY,
  perm_group  varchar(32) NOT NULL,
  perm_name   text NOT NULL,
  description text
);

CREATE INDEX IF NOT EXISTS idx_tbl_permission_group ON app.tbl_permission (perm_group);

COMMENT ON TABLE app.tbl_permission IS
  'Fine-grained permissions enforced by requirePermission() middleware.';

INSERT INTO app.tbl_permission (perm_code, perm_group, perm_name, description) VALUES
  ('dashboard.read', 'dashboard', 'ดู Dashboard', 'หน้าแรก / KPI'),

  ('calendar.read', 'calendar', 'ดูปฏิทิน', 'Work scheduling calendar'),
  ('calendar.write', 'calendar', 'แก้ปฏิทิน', 'ลากวัน / แก้แผนบนปฏิทิน'),

  ('backlog.read', 'backlog', 'ดู Backlog', 'แผนค้าง'),
  ('backlog.write', 'backlog', 'แก้ Backlog', 'Manhour summary / ปรับแผนค้าง'),

  ('planning.read', 'planning', 'ดูแผน PM/CM', 'Planning board'),
  ('planning.write', 'planning', 'แก้แผน PM/CM', 'สร้าง/แก้แผน'),
  ('planning.assign', 'planning', 'จ่ายงาน', 'Multi-assign / batch planning'),
  ('planning.delete', 'planning', 'ลบผู้รับมอบหมาย', 'ลบ assignee จากแผน'),

  ('work-orders.read', 'work-orders', 'ดูใบงาน', 'WO list / detail'),
  ('work-orders.write', 'work-orders', 'แก้ใบงาน', 'แก้ไข WO'),
  ('work-orders.delete', 'work-orders', 'ลบใบงาน', 'ลบ WO'),
  ('work-orders.import', 'work-orders', 'นำเข้าใบงาน', 'Import WO'),
  ('work-orders.export', 'work-orders', 'ส่งออกใบงาน', 'Export WO'),

  ('confirmation.read', 'confirmation', 'ดู Confirmation', 'รายการรับรอง'),
  ('confirmation.write', 'confirmation', 'บันทึก Confirmation', 'บันทึก/แก้ confirm'),
  ('confirmation.close', 'confirmation', 'ปิด WO', 'ปิดงานหลัง confirm'),
  ('confirmation.import', 'confirmation', 'นำเข้า Confirm', 'Import confirm Excel'),
  ('confirmation.export', 'confirmation', 'ส่งออก Confirm', 'Export confirm Excel'),

  ('personnel.read', 'personnel', 'ดูบุคลากร', 'Personal dashboard / โปรไฟล์'),
  ('personnel.write', 'personnel', 'แก้บุคลากร', 'CRUD workcenter'),
  ('personnel.import', 'personnel', 'นำเข้าบุคลากร', 'Excel import personnel'),
  ('personnel.delete', 'personnel', 'ลบบุคลากร', 'ลบ workcenter'),
  ('personnel.confirm.read', 'personnel', 'ดู Personnel Confirm', 'Admin progress %'),

  ('master-data.read', 'master-data', 'ดู Master Data', 'อ่านข้อมูลหลัก'),
  ('master-data.write', 'master-data', 'แก้ Master Data', 'CRUD master'),
  ('master-data.delete', 'master-data', 'ลบ Master Data', 'ลบ master row'),
  ('master-data.import', 'master-data', 'นำเข้า Master Data', 'Import master'),
  ('master-data.export', 'master-data', 'ส่งออก Master Data', 'Export master'),

  ('iw37n.read', 'iw37n', 'ดู IW37N', 'รายการนำเข้า SAP'),
  ('iw37n.write', 'iw37n', 'แก้ IW37N', 'แก้ไขรายการ import'),
  ('iw37n.import', 'iw37n', 'นำเข้า IW37N', 'Upload SAP Excel'),
  ('iw37n.export', 'iw37n', 'ส่งออก IW37N', 'Export IW37N'),

  ('reports.read', 'reports', 'ดูรายงาน', 'KPI / สรุปรายสัปดาห์'),
  ('reports.export', 'reports', 'ส่งออกรายงาน', 'Export รายงาน'),

  ('manhours.read', 'manhours', 'ดู Manhours', 'สรุป / worktime / HR'),
  ('manhours.write', 'manhours', 'บันทึก Manhours', 'บันทึกชั่วโมง'),
  ('manhours.delete', 'manhours', 'ลบ Manhours', 'ลบรายการ manhour'),
  ('manhours.import', 'manhours', 'นำเข้า Manhours', 'Excel import'),
  ('manhours.export', 'manhours', 'ส่งออก Manhours', 'Export manhour'),
  ('manhours.admin', 'manhours', 'Admin Manhours', 'หน้า /manhours/admin CRUD'),

  ('user-log.read', 'user-log', 'ดู User Log', 'ประวัติการใช้งาน'),

  ('admin.console.read', 'admin', 'Admin Console', 'หน้า /admin hub'),

  ('admin.users.read', 'admin.users', 'ดูผู้ใช้ (Admin)', 'รายการ users'),
  ('admin.users.write', 'admin.users', 'จัดการผู้ใช้', 'CRUD / lock / reset password'),
  ('admin.users.impersonate', 'admin.users', 'สวมสิทธิ์ผู้ใช้', 'Impersonate user'),

  ('admin.roles.read', 'admin.roles', 'ดู Roles', 'RBAC matrix read'),
  ('admin.roles.write', 'admin.roles', 'จัดการ Roles', 'Grant/revoke / custom role'),

  ('admin.menu.read', 'admin.menu', 'ดูเมนู', 'Menu builder read'),
  ('admin.menu.write', 'admin.menu', 'แก้เมนู', 'Menu builder write'),

  ('admin.branding.read', 'admin.branding', 'ดู Branding', 'โลโก้/ธีม read'),
  ('admin.branding.write', 'admin.branding', 'แก้ Branding', 'อัปโหลดโลโก้/สี'),

  ('admin.settings.read', 'admin.settings', 'ดูตั้งค่าระบบ', 'System settings read'),
  ('admin.settings.write', 'admin.settings', 'แก้ตั้งค่าระบบ', 'System settings write'),

  ('admin.audit.read', 'admin.audit', 'ดู Audit Log', 'บันทึกกิจกรรม'),
  ('admin.audit.delete', 'admin.audit', 'ลบ Audit เก่า', 'Cleanup audit rows'),

  ('admin.backup.read', 'admin.backup', 'ดู Backup', 'ประวัติสำรอง'),
  ('admin.backup.write', 'admin.backup', 'สำรองข้อมูล', 'Manual backup'),
  ('admin.backup.delete', 'admin.backup', 'ลบไฟล์ Backup', 'Delete backup file'),
  ('admin.backup.restore', 'admin.backup', 'กู้คืน Backup', 'Restore database'),

  ('admin.health.read', 'admin.health', 'ดูสุขภาพระบบ', 'Health dashboard'),
  ('admin.health.migrate', 'admin.health', 'รัน Migration', 'Apply pending migrations'),

  ('admin.security.read', 'admin.security', 'รายงานความปลอดภัย', 'Failed login / RBAC deny'),

  ('admin.announcement.read', 'admin.announcement', 'ดูประกาศ', 'Announcements read'),
  ('admin.announcement.write', 'admin.announcement', 'จัดการประกาศ', 'CRUD announcements'),

  ('admin.about.read', 'admin.about', 'เกี่ยวกับระบบ', 'About / version')
ON CONFLICT (perm_code) DO UPDATE SET
  perm_group = EXCLUDED.perm_group,
  perm_name = EXCLUDED.perm_name,
  description = EXCLUDED.description;

COMMIT;
