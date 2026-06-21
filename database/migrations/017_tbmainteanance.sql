CREATE TABLE IF NOT EXISTS app.tbmainteanance (
  machine       varchar(64) PRIMARY KEY,
  idzone        varchar(64) REFERENCES app.tbzone (idzone) ON DELETE SET NULL,
  idwkctrtype   varchar(64) REFERENCES app.tbwkctrtype (idwkctrtype) ON DELETE SET NULL
);

INSERT INTO app.tbmainteanance (machine, idzone, idwkctrtype) VALUES
  ('MACHINE-01', 'ZN01', 'TYPE01')
ON CONFLICT (machine) DO NOTHING;
