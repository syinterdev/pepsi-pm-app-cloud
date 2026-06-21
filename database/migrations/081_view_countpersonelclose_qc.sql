-- 081 — Personnel Confirm นับ % ปิดงานเฉพาะหลัง Admin QC อนุมัติ
-- รัน: psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f database/migrations/081_view_countpersonelclose_qc.sql
--
-- ต้อง DROP ก่อน — CREATE OR REPLACE ไม่รองรับการเพิ่มคอลัมน์กลาง view (42P16)

DROP VIEW IF EXISTS app.view_countpersonelclose;

CREATE VIEW app.view_countpersonelclose AS
SELECT
  i.idiw37,
  i.wkorder,
  i.wktype,
  i.mntplan,
  i.mat,
  i.equdescrip,
  i.functionalloc,
  i.operationshorttext,
  i.bscstart,
  i.actfinish,
  i.systemstatus,
  i.syst,
  i.wkctr,
  ws.wkstcolor,
  mov.cday,
  i.confirm_qc_status,
  i.confirm_qc_at,
  i.confirm_qc_by,
  COALESCE(plan_agg.planned_count, 0) AS planned_count,
  COALESCE(conf_agg.countwkctr, 0) AS countwkctr,
  CASE
    WHEN COALESCE(plan_agg.planned_count, 0) = 0 THEN 0
    ELSE ROUND(
      COALESCE(conf_agg.countwkctr, 0)::numeric * 100.0
      / plan_agg.planned_count::numeric
    )
  END AS percent_close,
  CASE
    WHEN COALESCE(conf_agg.confirm_rows, 0) > 0 THEN 1
    ELSE 0
  END AS has_confirm
FROM app.tbiw37n i
LEFT JOIN app.tbwkstatus ws ON ws.syst = i.syst
LEFT JOIN app.tbmoveplan mov ON mov.idiw37 = i.idiw37
LEFT JOIN (
  SELECT idiw37, COUNT(*)::int AS planned_count
  FROM app.tbplangingwork
  GROUP BY idiw37
) plan_agg ON plan_agg.idiw37 = i.idiw37
LEFT JOIN (
  SELECT c.idiw37,
         COUNT(DISTINCT c.wkctr)::int AS countwkctr,
         COUNT(*)::int AS confirm_rows
  FROM app.tbcofirm c
  INNER JOIN app.tbiw37n wo ON wo.idiw37 = c.idiw37
  WHERE wo.confirm_qc_status = 'approved'
  GROUP BY c.idiw37
) conf_agg ON conf_agg.idiw37 = i.idiw37;

COMMENT ON VIEW app.view_countpersonelclose IS
  'M_personel_confirm.php — % ปิดงานหลัง confirm_qc_status=approved';
