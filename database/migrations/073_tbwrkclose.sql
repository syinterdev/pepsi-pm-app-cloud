-- 073 — ช่างบันทึกเวลาปิดงานก่อนรับรอง (เทียบ tbwrkclose / AddClosePersonel.php)
-- รัน: psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f database/migrations/073_tbwrkclose.sql

CREATE TABLE IF NOT EXISTS app.tbwrkclose (
  idwrkclose  serial PRIMARY KEY,
  idiw37      integer NOT NULL REFERENCES app.tbiw37n (idiw37) ON DELETE CASCADE,
  cstdate     bigint NOT NULL,
  cendate     bigint NOT NULL,
  wkctr       varchar(64) NOT NULL,
  wktimeclose bigint NOT NULL,
  wktimewk    integer NOT NULL,
  wkunit      varchar(8) NOT NULL DEFAULT 'Min'
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_tbwrkclose_idiw37_wkctr
  ON app.tbwrkclose (idiw37, wkctr);

CREATE INDEX IF NOT EXISTS idx_tbwrkclose_idiw37 ON app.tbwrkclose (idiw37);

CREATE OR REPLACE VIEW app.view_personelclose AS
SELECT
  w.idwrkclose,
  w.idiw37,
  w.cstdate,
  w.cendate,
  w.wkctr,
  w.wktimeclose,
  w.wktimewk,
  w.wkunit,
  wc.titlewkctr,
  wc.namewkctr,
  wc.surnamewkctr,
  wc.titlewkctreng,
  wc.namewkctreng,
  wc.surnamewkctreng
FROM app.tbwrkclose w
LEFT JOIN app.tbworkcenter wc ON wc.wkctr = w.wkctr;

COMMENT ON TABLE app.tbwrkclose IS 'Legacy tbwrkclose — technician work-time before supervisor confirm (AddClosePersonel.php)';
COMMENT ON VIEW app.view_personelclose IS 'Legacy view_personelclose — ShowWorkClose.php / plan_ShowClose_close.php';
