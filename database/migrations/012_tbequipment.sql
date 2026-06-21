CREATE TABLE IF NOT EXISTS app.tbequipment (
  equipment      varchar(64) PRIMARY KEY,
  equdescrip     text NOT NULL,
  equipmentsub   text,
  functionalloc  text,
  equl           text,
  equ1           text,
  equea          text
);

INSERT INTO app.tbequipment (
  equipment,
  equdescrip,
  equipmentsub,
  functionalloc,
  equl,
  equ1,
  equea
)
VALUES
  ('EQ0001', 'Sample Equipment', '', '', '', '', '')
ON CONFLICT (equipment) DO NOTHING;
