-- 014 — Work center type (เทียบ tbwkctrtype / M_worktype.php)
-- รัน: psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f database/migrations/014_tbwkctrtype.sql

CREATE TABLE IF NOT EXISTS app.tbwkctrtype (
  idwkctrtype varchar(64) PRIMARY KEY,
  wkctrtype   text NOT NULL
);

INSERT INTO app.tbwkctrtype (idwkctrtype, wkctrtype) VALUES
  ('TYPE01', 'Type 01')
ON CONFLICT (idwkctrtype) DO NOTHING;
