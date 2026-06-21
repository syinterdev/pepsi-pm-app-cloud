-- 003 — Line product schedule (เทียบ view_lineschdul / tblineschdul + line_calendar.php)
-- รัน: psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f database/migrations/003_tblineschdul.sql

CREATE TABLE IF NOT EXISTS app.tblineschdul (
  idline         serial PRIMARY KEY,
  idproductline  varchar(64),
  productline    varchar(128) NOT NULL,
  lineday        bigint,
  uptime         numeric(10, 2),
  linereason     varchar(128)
);

CREATE INDEX IF NOT EXISTS idx_tblineschdul_lineday ON app.tblineschdul (lineday);

COMMENT ON TABLE app.tblineschdul IS 'Legacy tblineschdul — line_calendar.php FullCalendar events';

-- ตัวอย่าง: วันนี้ + พรุ่งนี้ (lineday = unix วินาที)
INSERT INTO app.tblineschdul (idproductline, productline, lineday, uptime, linereason)
SELECT
  v.idproductline,
  v.productline,
  v.lineday,
  v.uptime,
  v.linereason
FROM (
  VALUES
    ('LP01', 'Line A', EXTRACT(EPOCH FROM CURRENT_DATE)::bigint, 4.0, NULL),
    ('LP02', 'Line B', EXTRACT(EPOCH FROM (CURRENT_DATE + INTERVAL '1 day'))::bigint, NULL, 'CLOSED')
) AS v(idproductline, productline, lineday, uptime, linereason)
WHERE NOT EXISTS (SELECT 1 FROM app.tblineschdul LIMIT 1);
