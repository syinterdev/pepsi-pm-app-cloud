CREATE TABLE IF NOT EXISTS app.tbzone (
  idzone  varchar(64) PRIMARY KEY,
  zone    text NOT NULL
);

INSERT INTO app.tbzone (idzone, zone) VALUES
  ('ZN01', 'ZONE 01'),
  ('ZN02', 'ZONE 02')
ON CONFLICT (idzone) DO NOTHING;
