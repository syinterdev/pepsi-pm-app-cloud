CREATE TABLE IF NOT EXISTS app.tbmaterial (
  idmaterial     serial PRIMARY KEY,
  wkorder        varchar(64) NOT NULL,
  matdoc         varchar(64),
  entrydate      date,
  matpo          varchar(64),
  pstngdate      date NOT NULL,
  docdate        date,
  materialdesc   text NOT NULL,
  matquantity    numeric(18, 3),
  matbun         varchar(32),
  amountinlc     numeric(18, 2) NOT NULL,
  crcy           varchar(16),
  mvt            varchar(32) NOT NULL,
  costctr        varchar(64),
  mattime        varchar(32),
  matyr          varchar(16),
  material       varchar(64)
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_tbmaterial_uniq
ON app.tbmaterial (wkorder, pstngdate, amountinlc, mvt);
