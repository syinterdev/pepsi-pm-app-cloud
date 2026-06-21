-- 027 — view_lineschdul (legacy parity for sap/pages/line_calendar.php)
-- รัน: psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f database/migrations/027_view_lineschdul.sql

CREATE OR REPLACE VIEW app.view_lineschdul AS
SELECT
  idline,
  idproductline,
  productline,
  lineday,
  uptime,
  linereason
FROM app.tblineschdul;

COMMENT ON VIEW app.view_lineschdul IS 'Legacy view_lineschdul — used by sap/pages/line_calendar.php (FullCalendar events source)';
