CREATE TABLE IF NOT EXISTS app.tbposition (
  idposition  varchar(64) PRIMARY KEY,
  position    text NOT NULL
);

INSERT INTO app.tbposition (idposition, position) VALUES
  ('POS01', 'Position 01')
ON CONFLICT (idposition) DO NOTHING;
