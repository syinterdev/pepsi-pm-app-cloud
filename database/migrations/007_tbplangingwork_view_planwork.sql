-- 007 — Plan work assignment (เทียบ tbplangingwork + view_planwork / M_planwork_view.php)
-- รัน: psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f database/migrations/007_tbplangingwork_view_planwork.sql

CREATE TABLE IF NOT EXISTS app.tbplangingwork (
  idplanw    serial PRIMARY KEY,
  wkctr      varchar(64),
  idiw37     integer NOT NULL REFERENCES app.tbiw37n (idiw37) ON DELETE CASCADE,
  wkctrpw    varchar(64),
  pwcomment  text,
  pwteam     varchar(8)
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_tbplangingwork_idiw37 ON app.tbplangingwork (idiw37);

COMMENT ON TABLE app.tbplangingwork IS 'Legacy tbplangingwork — supervisor assigns work to WC (M_planwork_view_form)';

CREATE OR REPLACE VIEW app.view_planwork AS
SELECT
  i.idiw37,
  i.mntplan,
  i.wkorder,
  i.wktype,
  i.mat,
  i.bscstart,
  i.actfinish,
  i.systemstatus,
  i.syst,
  i.operationshorttext,
  i.equdescrip,
  i.functionalloc,
  i.wkctr,
  mp.idplanw,
  mp.wkctrpw,
  mp.pwcomment,
  mp.pwteam,
  wc.idwkctr,
  mov.cday,
  ws.wkstcolor
FROM app.tbiw37n i
LEFT JOIN app.tbplangingwork mp ON mp.idiw37 = i.idiw37
LEFT JOIN app.tbworkcenter wc ON wc.wkctr = COALESCE(mp.wkctr, i.wkctr)
LEFT JOIN app.tbmoveplan mov ON mov.idiw37 = i.idiw37
LEFT JOIN app.tbwkstatus ws ON ws.syst = i.syst;

COMMENT ON VIEW app.view_planwork IS 'Legacy view_planwork — M_planwork_view, W_planwork_view';
