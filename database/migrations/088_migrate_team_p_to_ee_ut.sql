-- 088 — แปลง PM Plan team เก่า P → EE / UT
-- กฎ (ตามรหัสช่าง Engineering):
--   UTI*  → UT (Utility)
--   PAC* / PRO* → EE (Electrical Engineering)
--   ไม่มีรหัสช่าง → EE (ค่าเริ่มต้น — ปรับ manual ได้หลังรัน)
-- แหล่ง wkctr: tbiw37n.wkctr → tbplangingwork.wkctr → tbmoveplan.mwkctr
-- รัน: psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f database/migrations/088_migrate_team_p_to_ee_ut.sql

WITH targets AS (
  SELECT
    i.idiw37,
    upper(trim(coalesce(
      nullif(trim(i.wkctr), ''),
      nullif(trim(plan.wkctr), ''),
      nullif(trim(mov.mwkctr), '')
    ))) AS wkctr_resolved
  FROM app.tbiw37n i
  LEFT JOIN LATERAL (
    SELECT p.wkctr
    FROM app.tbplangingwork p
    WHERE p.idiw37 = i.idiw37
    ORDER BY p.idplanw
    LIMIT 1
  ) plan ON true
  LEFT JOIN app.tbmoveplan mov ON mov.idiw37 = i.idiw37
  WHERE upper(trim(coalesce(i.team, ''))) = 'P'
),
mapped AS (
  SELECT
    idiw37,
    CASE
      WHEN wkctr_resolved ~ '^UTI[0-9]{3}$' THEN 'UT'
      WHEN wkctr_resolved ~ '^(PAC|PRO)[0-9]{3}$' THEN 'EE'
      ELSE 'EE'
    END AS new_team
  FROM targets
)
UPDATE app.tbiw37n i
SET team = m.new_team
FROM mapped m
WHERE i.idiw37 = m.idiw37;

-- สรุปหลัง migrate (แสดงใน psql)
DO $$
DECLARE
  remaining_p integer;
  cnt_ee integer;
  cnt_ut integer;
BEGIN
  SELECT count(*) INTO remaining_p
  FROM app.tbiw37n
  WHERE upper(trim(coalesce(team, ''))) = 'P';

  SELECT count(*) INTO cnt_ee FROM app.tbiw37n WHERE team = 'EE';
  SELECT count(*) INTO cnt_ut FROM app.tbiw37n WHERE team = 'UT';

  RAISE NOTICE '088 team migrate: remaining P=%, total EE=%, total UT=%',
    remaining_p, cnt_ee, cnt_ut;
END $$;
