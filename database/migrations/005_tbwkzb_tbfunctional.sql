-- 005 — Work type (ZB) + Functional location สำหรับฟิลเตอร์ backlog/calendar
-- รัน: psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f database/migrations/005_tbwkzb_tbfunctional.sql

CREATE TABLE IF NOT EXISTS app.tbwkzb (
  wkzb       varchar(32) PRIMARY KEY,
  zbdescrip  text
);

CREATE TABLE IF NOT EXISTS app.tbfunctional (
  functionalloc     varchar(64) PRIMARY KEY,
  funldescrip       text,
  functionallocsub  varchar(64)
);

COMMENT ON TABLE app.tbwkzb IS 'Legacy tbwkzb — M_zb.php / Type filter';
COMMENT ON TABLE app.tbfunctional IS 'Legacy tbfunctional — M_functional.php / Product line filter';

INSERT INTO app.tbwkzb (wkzb, zbdescrip) VALUES
  ('PM01', 'งาน PM'),
  ('PM02', 'งาน PM รายสัปดาห์'),
  ('PM03', 'งาน PM หล่อลื่น'),
  ('PM04', 'งาน PM อื่นๆ'),
  ('ZB01', 'Corrective'),
  ('ZB05', 'Breakdown')
ON CONFLICT (wkzb) DO NOTHING;

INSERT INTO app.tbfunctional (functionalloc, funldescrip, functionallocsub) VALUES
  ('7151-FILLER-01', 'สายบรรจุ 1', NULL),
  ('7151-CONV-02', 'สายพาน 2', NULL),
  ('7151-PUMP-03', 'ปั๊มถ่าย 3', NULL),
  ('7151-PL01', 'Product line 01', NULL),
  ('7151-PL02', 'Product line 02', NULL)
ON CONFLICT (functionalloc) DO NOTHING;
