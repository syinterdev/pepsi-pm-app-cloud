CREATE TABLE IF NOT EXISTS app.tbwklevel (
  idwklevel  varchar(64) PRIMARY KEY,
  wklevel    text NOT NULL
);

INSERT INTO app.tbwklevel (idwklevel, wklevel) VALUES
  ('LV01', 'Level 01')
ON CONFLICT (idwklevel) DO NOTHING;
