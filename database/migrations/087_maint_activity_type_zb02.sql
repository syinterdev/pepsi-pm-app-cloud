-- 087 — MaintActivityType ZB02 (19 รายการ — ลูกค้า)
-- รัน: psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f database/migrations/087_maint_activity_type_zb02.sql

INSERT INTO app.tbactivitytype (mat, matdescrip, matcheck) VALUES
  ('001', 'Inspection & Cond. Monitoring', 'Y'),
  ('002', 'Preventive Maintenance', 'Y'),
  ('007', 'Cleaning', 'Y'),
  ('009', 'Work out of inspection', 'Y'),
  ('013', 'Audit (AIB) / Food Safety', 'Y'),
  ('016', 'Meeting', 'Y'),
  ('017', 'Assistance to Ops', 'Y'),
  ('018', 'Statutory', 'Y'),
  ('019', 'Training', 'Y'),
  ('022', 'Environmental & Sustainability', 'Y'),
  ('023', 'Safety', 'Y'),
  ('027', 'Modification', 'Y'),
  ('029', 'RCA (Root Cause Analysis)', 'Y'),
  ('033', 'Lubrication', 'Y'),
  ('034', 'Calibration', 'Y'),
  ('035', 'Improve Perf to Spec (IPS)', 'Y'),
  ('038', 'Maintenance - Entry list WM', 'Y'),
  ('039', 'Operations - Entry list WM', 'Y'),
  ('040', 'Dry run - Entry list WM', 'Y')
ON CONFLICT (mat) DO UPDATE SET
  matdescrip = EXCLUDED.matdescrip,
  matcheck = EXCLUDED.matcheck;
