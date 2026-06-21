-- 004 — Work order calendar (เทียบ view_order + calendar.php + M_filter_iw37.php)
-- รัน: psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f database/migrations/004_tbiw37n_calendar.sql

CREATE TABLE IF NOT EXISTS app.tbwkstatus (
  syst       varchar(32) PRIMARY KEY,
  wkstcolor  varchar(32) NOT NULL
);

CREATE TABLE IF NOT EXISTS app.tbiw37n (
  idiw37               serial PRIMARY KEY,
  mntplan              varchar(64),
  wkorder              varchar(64) NOT NULL,
  wktype               varchar(32),
  mat                  varchar(64),
  bscstart             bigint,
  actfinish            bigint,
  systemstatus         varchar(128),
  syst                 varchar(32),
  opac                 varchar(32),
  operationshorttext   text,
  ostdescription       text,
  cknow                varchar(8),
  wkctr                varchar(64),
  work                 numeric(12, 2),
  actwork              numeric(12, 2),
  untime               numeric(12, 2),
  equipment            varchar(64),
  equdescrip           text,
  functionalloc        varchar(64),
  funcdescrip          text,
  team                 varchar(8)
);

CREATE INDEX IF NOT EXISTS idx_tbiw37n_bscstart ON app.tbiw37n (bscstart);
CREATE INDEX IF NOT EXISTS idx_tbiw37n_syst ON app.tbiw37n (syst);
CREATE INDEX IF NOT EXISTS idx_tbiw37n_functionalloc ON app.tbiw37n (functionalloc);

CREATE TABLE IF NOT EXISTS app.tbmoveplan (
  idmoveplan   serial PRIMARY KEY,
  idiw37       integer NOT NULL REFERENCES app.tbiw37n (idiw37) ON DELETE CASCADE,
  cday         bigint NOT NULL,
  mday         bigint,
  mwkctr       varchar(64),
  reasoncode   varchar(64),
  resoncom     text,
  mpcount      integer NOT NULL DEFAULT 1
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_tbmoveplan_idiw37 ON app.tbmoveplan (idiw37);

CREATE OR REPLACE VIEW app.view_order AS
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
  i.opac,
  i.operationshorttext,
  i.ostdescription,
  i.cknow,
  i.wkctr,
  i.work,
  i.actwork,
  i.untime,
  i.equipment,
  i.equdescrip,
  i.functionalloc,
  i.funcdescrip,
  i.team,
  mp.cday,
  ws.wkstcolor
FROM app.tbiw37n i
LEFT JOIN app.tbmoveplan mp ON mp.idiw37 = i.idiw37
LEFT JOIN app.tbwkstatus ws ON ws.syst = i.syst;

COMMENT ON VIEW app.view_order IS 'Legacy view_order — calendar.php / backlog.php / M_filter_iw37';

INSERT INTO app.tbwkstatus (syst, wkstcolor) VALUES
  ('CRTD', '#3b82f6'),
  ('REL', '#22c55e'),
  ('MOVE OVER', '#f97316')
ON CONFLICT (syst) DO NOTHING;

INSERT INTO app.tbiw37n (
  wkorder, wktype, mat, bscstart, syst, operationshorttext, functionalloc, equdescrip
)
SELECT v.wkorder, v.wktype, v.mat, v.bscstart, v.syst, v.operationshorttext, v.functionalloc, v.equdescrip
FROM (
  VALUES
    (
      '4000001',
      'PM01',
      '01',
      EXTRACT(EPOCH FROM (CURRENT_DATE))::bigint,
      'REL',
      'Calibration motor line 3',
      '7151-FILLER-01',
      'Filler motor M1'
    ),
    (
      '4000002',
      'PM02',
      '02',
      EXTRACT(EPOCH FROM (CURRENT_DATE + INTERVAL '2 day'))::bigint,
      'CRTD',
      'Weekly conveyor inspection',
      '7151-CONV-02',
      'Conveyor belt B'
    ),
    (
      '4000003',
      'ZB01',
      '01',
      EXTRACT(EPOCH FROM (CURRENT_DATE + INTERVAL '1 day'))::bigint,
      'REL',
      'Corrective bearing replace',
      '7151-PUMP-03',
      'Transfer pump P3'
    )
) AS v(wkorder, wktype, mat, bscstart, syst, operationshorttext, functionalloc, equdescrip)
WHERE NOT EXISTS (SELECT 1 FROM app.tbiw37n LIMIT 1);
