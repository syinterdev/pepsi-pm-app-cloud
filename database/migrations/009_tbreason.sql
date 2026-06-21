-- 009 — เหตุผลย้ายแผน (เทียบ tbreason + MovePlant.php / ModalOrderDetail.php)
-- รัน: psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f database/migrations/009_tbreason.sql

CREATE TABLE IF NOT EXISTS app.tbreason (
  reasoncode varchar(64) PRIMARY KEY,
  reasonname text NOT NULL
);

INSERT INTO app.tbreason (reasoncode, reasonname) VALUES
  ('01', 'เครื่องจักรยังไม่หยุด'),
  ('02', 'รออะไหล่'),
  ('03', 'เปลี่ยนแผนผลิต'),
  ('04', 'งานเร่งด่วน'),
  ('99', 'อื่นๆ')
ON CONFLICT (reasoncode) DO NOTHING;
