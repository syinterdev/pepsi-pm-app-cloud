-- 078 — คำอธิบาย tbwkzb สอดคล้อง ZD ประชุมลูกค้า ครั้งที่ 2 (7 พ.ค. 2569)
-- รัน: psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f database/migrations/078_tbwkzb_zd_mapping_labels.sql

INSERT INTO app.tbwkzb (wkzb, zbdescrip) VALUES
  ('ZB02', 'Preventive (PM) — SAP ZD02'),
  ('ZB03', 'Legacy type ZB03'),
  ('ZB04', 'Legacy type ZB04')
ON CONFLICT (wkzb) DO UPDATE SET zbdescrip = EXCLUDED.zbdescrip;

UPDATE app.tbwkzb SET zbdescrip = 'Breakdown — SAP ZD01' WHERE wkzb = 'ZB05';
UPDATE app.tbwkzb SET zbdescrip = 'General Repair / Corrective — SAP ZD05' WHERE wkzb = 'ZB01';
