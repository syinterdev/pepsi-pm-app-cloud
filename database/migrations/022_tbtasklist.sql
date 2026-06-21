CREATE TABLE IF NOT EXISTS app.tbtasklist (
  idtasklist      serial PRIMARY KEY,
  idwkctrtype     varchar(64) NOT NULL REFERENCES app.tbwkctrtype (idwkctrtype),
  idzone          varchar(64) NOT NULL REFERENCES app.tbzone (idzone),
  idmachine       varchar(64) REFERENCES app.tbmainteanance (machine) ON DELETE SET NULL,
  mntplan         varchar(128) NOT NULL,
  tasklist        varchar(128) NOT NULL,
  legacy          varchar(128) NOT NULL,
  machine         varchar(128) NOT NULL,
  pmlist          varchar(128) NOT NULL,
  pmday           integer,
  machinestatus   integer,
  pmmin           numeric(18, 2),
  pmman           numeric(18, 2),
  manhour         numeric(18, 2),
  mat             varchar(64),
  runhr           numeric(18, 2),
  mpoint          text,
  bcprunhr        numeric(18, 2),
  gls             text,
  ment            text,
  freqhour        numeric(18, 2),
  plan            text
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_tbtasklist_uniq
ON app.tbtasklist (idwkctrtype, idzone, mntplan, tasklist, machine, pmlist);
