-- 036 — View `view_countpersonelclose` (เทียบ legacy `M_personel_confirm.php`)
-- รัน: psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f database/migrations/036_view_countpersonelclose.sql
--
-- ใช้แสดง progress bar % ของจำนวนช่างที่ "ปิดงาน" ต่อ WO บนหน้า Personnel Confirmation
--   * planned_count  = COUNT(*) จาก tbplangingwork ที่มี idiw37 นี้
--   * countwkctr     = COUNT(DISTINCT wkctr) จาก tbcofirm ที่มี idiw37 นี้
--   * percent_close  = round(countwkctr / NULLIF(planned_count,0) * 100)
--
-- กรองในแอปอีกชั้นด้วย syst IN ('CRTD','REL') (PHP `WHERE syst='CRTD' OR syst='REL'`)
-- และเรียงตาม countwkctr ASC (รายการที่ยังปิดน้อยขึ้นก่อน) เหมือน PHP

CREATE OR REPLACE VIEW app.view_countpersonelclose AS
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
  COALESCE(plan_agg.planned_count, 0) AS planned_count,
  COALESCE(conf_agg.countwkctr, 0)    AS countwkctr,
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
  SELECT idiw37,
         COUNT(DISTINCT wkctr)::int AS countwkctr,
         COUNT(*)::int              AS confirm_rows
  FROM app.tbcofirm
  GROUP BY idiw37
) conf_agg ON conf_agg.idiw37 = i.idiw37;

COMMENT ON VIEW app.view_countpersonelclose IS
  'Legacy view_countpersonelclose — M_personel_confirm.php (progress bar % ของช่างที่ปิดงาน/WO)';
