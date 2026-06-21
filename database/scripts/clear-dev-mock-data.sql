-- ล้างข้อมูล mock / dev ทั้งหมด — เหลือผู้ใช้ ADMIN01 เท่านั้น
-- รักษา: schema, เมนู, RBAC, tbl_setting, master reference (tbactivitytype, tbwkzb, …)
--
-- รัน:
--   psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f database/scripts/clear-dev-mock-data.sql
--
-- หลังรัน: login ADMIN01 / admin

BEGIN;

-- ── 1) ข้อมูลธุรกรรม / demo (ลูก → แม่) ─────────────────────────────────────

DELETE FROM app.tbconfirmcom;
DELETE FROM app.tbconfirmimg;
DELETE FROM app.tbcofirm;
DELETE FROM app.tbwrkclose;

DELETE FROM app.tbwo_pm_note_entry;
DELETE FROM app.tbwo_pm_reading;
DELETE FROM app.tbwo_pm_note;

DELETE FROM app.tbplangingwork;
DELETE FROM app.tbmoveplan;

DELETE FROM app.tbiw37n_import_row;
DELETE FROM app.tbiw37n_import_batch;
DELETE FROM app.tbiw37n;

DELETE FROM app.tblineschdul;
DELETE FROM app.tbmanhours;

DELETE FROM app.tb_master_plan_change;
DELETE FROM app.tb_master_plan_row;
DELETE FROM app.tb_master_plan_sheet;
DELETE FROM app.tb_master_plan_workbook;

DELETE FROM app.integration_job;
DELETE FROM app.tbl_resource_revision;

DELETE FROM app.tbl_telegram_notify_group_member;
DELETE FROM app.tbl_telegram_notify_group;
DELETE FROM app.tbl_telegram_link_token;
DELETE FROM app.tbl_telegram_chat_session;

DELETE FROM app.tbl_module_handoff_code;
DELETE FROM app.tbl_app_notification;

DELETE FROM app.tbl_backup_history;
DELETE FROM app.tbl_audit_log;
DELETE FROM app.tbl_announcement;

DELETE FROM app.tbl_user_pref
WHERE user_id IS DISTINCT FROM 'ADMIN01';

DELETE FROM app.tbworkcenter_userlog;
DELETE FROM app.tbl_system_userlog;

-- ── 2) ผู้ใช้ — เหลือ ADMIN01 ───────────────────────────────────────────────

DELETE FROM app.tbl_member;

DELETE FROM app.tbworkcenter
WHERE idwkctr <> 'ADMIN01';

INSERT INTO app.tbworkcenter (
  idwkctr, pass, wkctr, plnt,
  wkctrdate, startwork,
  titlewkctr, namewkctr, surnamewkctr,
  titlewkctreng, namewkctreng, surnamewkctreng,
  userst
) VALUES (
  'ADMIN01', 'admin', 'ADMIN01', '7151',
  631152000, 631152000,
  'นาย', 'ผู้ดูแล', 'ระบบ',
  'Mr.', 'Admin', 'User',
  'A'
)
ON CONFLICT (idwkctr) DO UPDATE SET
  pass = EXCLUDED.pass,
  wkctr = EXCLUDED.wkctr,
  plnt = EXCLUDED.plnt,
  titlewkctr = EXCLUDED.titlewkctr,
  namewkctr = EXCLUDED.namewkctr,
  surnamewkctr = EXCLUDED.surnamewkctr,
  titlewkctreng = EXCLUDED.titlewkctreng,
  namewkctreng = EXCLUDED.namewkctreng,
  surnamewkctreng = EXCLUDED.surnamewkctreng,
  userst = 'A',
  pass_must_change = false;

COMMIT;

-- ── 3) สรุปหลังล้าง ────────────────────────────────────────────────────────
SELECT 'tbworkcenter' AS tbl, COUNT(*)::text AS n FROM app.tbworkcenter
UNION ALL SELECT 'tbl_member', COUNT(*)::text FROM app.tbl_member
UNION ALL SELECT 'tbiw37n', COUNT(*)::text FROM app.tbiw37n
UNION ALL SELECT 'tbplangingwork', COUNT(*)::text FROM app.tbplangingwork
UNION ALL SELECT 'tbmanhours', COUNT(*)::text FROM app.tbmanhours;
