CREATE TABLE IF NOT EXISTS app.tbwkctrgroup (
  idwkctrgroup      serial PRIMARY KEY,
  wkctrgroup        varchar(64) NOT NULL,
  wkctrdescription  text
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_tbwkctrgroup_code
ON app.tbwkctrgroup (wkctrgroup);
