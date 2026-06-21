CREATE TABLE IF NOT EXISTS app.tbcofirm (
  idclose       bigserial PRIMARY KEY,
  idiw37        integer NOT NULL REFERENCES app.tbiw37n (idiw37) ON DELETE CASCADE,
  confirmation  text        NOT NULL DEFAULT '',
  wkctr         varchar(64) NOT NULL,
  stdate        bigint      NOT NULL,
  endate        bigint      NOT NULL,
  cwkctr        varchar(64),
  timeclose     bigint      NOT NULL,
  timewk        integer     NOT NULL,
  unitc         varchar(8)  NOT NULL DEFAULT 'Min'
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_tbcofirm_uniq ON app.tbcofirm (idiw37, wkctr);

CREATE INDEX IF NOT EXISTS idx_tbcofirm_idiw37 ON app.tbcofirm (idiw37);

CREATE OR REPLACE VIEW app.view_confirmation AS
SELECT
  c.idclose,
  c.idiw37,
  c.confirmation,
  c.wkctr,
  c.stdate,
  c.endate,
  c.cwkctr,
  c.timeclose,
  c.timewk,
  c.unitc,
  wc.titlewkctr,
  wc.namewkctr,
  wc.surnamewkctr,
  wc.titlewkctreng,
  wc.namewkctreng,
  wc.surnamewkctreng,
  i.wkorder
FROM app.tbcofirm c
LEFT JOIN app.tbworkcenter wc ON wc.wkctr = c.wkctr
LEFT JOIN app.tbiw37n i ON i.idiw37 = c.idiw37;

