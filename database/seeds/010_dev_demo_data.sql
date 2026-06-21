-- 010 — ข้อมูล demo เสริม (หลัง migration + 009) — ให้ calendar/backlog/planning/dashboard มีข้อมูล
-- psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f database/seeds/010_dev_demo_data.sql
-- ต้องมี WC001 จาก 009

BEGIN;

-- ผูก WO กับ work center ของผู้ login ทดสอบ
UPDATE app.tbiw37n
SET wkctr = 'WC001',
    opac = COALESCE(NULLIF(TRIM(opac), ''), '0010')
WHERE wkctr IS NULL OR TRIM(wkctr) = '';

-- WO เพิ่มในเดือนปัจจุบัน (ถ้าต้องการมากกว่า sample ใน 004)
INSERT INTO app.tbiw37n (
  wkorder, wktype, mat, bscstart, syst, opac,
  operationshorttext, functionalloc, equdescrip, wkctr
)
SELECT v.wkorder, v.wktype, v.mat, v.bscstart, v.syst, v.opac,
       v.operationshorttext, v.functionalloc, v.equdescrip, 'WC001'
FROM (
  VALUES
    (
      '4000100',
      'PM01',
      '01',
      EXTRACT(EPOCH FROM (CURRENT_DATE + INTERVAL '3 day'))::bigint,
      'CRTD',
      '0020',
      'Lubrication line 4',
      '7151-PL01',
      'Packaging line 4'
    ),
    (
      '4000101',
      'ZB01',
      '01',
      EXTRACT(EPOCH FROM (CURRENT_DATE + INTERVAL '5 day'))::bigint,
      'REL',
      '0010',
      'Seal replacement',
      '7151-PL02',
      'Filling valve V2'
    ),
    (
      '4000102',
      'ZB02',
      '01',
      EXTRACT(EPOCH FROM CURRENT_DATE)::bigint,
      'REL',
      '0010',
      'PM motor inspection',
      '7151-MOT-01',
      'Main drive motor M1'
    ),
    (
      '4000103',
      'ZB05',
      '01',
      EXTRACT(EPOCH FROM (CURRENT_DATE + INTERVAL '1 day'))::bigint,
      'CRTD',
      '0020',
      'Breakdown conveyor stop',
      '7151-CONV-03',
      'Conveyor section C3'
    )
) AS v(wkorder, wktype, mat, bscstart, syst, opac, operationshorttext, functionalloc, equdescrip)
WHERE NOT EXISTS (SELECT 1 FROM app.tbiw37n x WHERE x.wkorder = v.wkorder AND x.opac = v.opac);

-- แผนจ่ายงานตัวอย่าง (planning / view_planwork)
INSERT INTO app.tbplangingwork (wkctr, idiw37, wkctrpw, pwcomment, pwteam)
SELECT 'WC001', i.idiw37, 'WC001', 'Demo assign', 'T1'
FROM app.tbiw37n i
WHERE i.wkorder = '4000001'
  AND NOT EXISTS (SELECT 1 FROM app.tbplangingwork p WHERE p.idiw37 = i.idiw37);

-- ปฏิทินเส้น — เพิ่มอีก 2 วัน (นอกจาก 003)
INSERT INTO app.tblineschdul (idproductline, productline, lineday, uptime, linereason)
SELECT v.idproductline, v.productline, v.lineday, v.uptime, v.linereason
FROM (
  VALUES
    ('LP03', 'Line C', EXTRACT(EPOCH FROM (CURRENT_DATE + INTERVAL '2 day'))::bigint, 6.0, NULL),
    ('LP04', 'Line D', EXTRACT(EPOCH FROM (CURRENT_DATE + INTERVAL '3 day'))::bigint, NULL, 'MAINT')
) AS v(idproductline, productline, lineday, uptime, linereason)
WHERE NOT EXISTS (
  SELECT 1 FROM app.tblineschdul l
  WHERE l.idproductline = v.idproductline AND l.lineday = v.lineday
);

-- ประวัติ import ตัวอย่าง (dashboard IW37N ล่าสุด)
INSERT INTO app.tbiw37n_import_batch (
  file_name, sha256, row_count, inserted_count, updated_count, skipped_count, status
)
SELECT 'demo_import.xlsx', repeat('a', 64), 10, 8, 2, 0, 'OK'
WHERE NOT EXISTS (SELECT 1 FROM app.tbiw37n_import_batch LIMIT 1);

COMMIT;
