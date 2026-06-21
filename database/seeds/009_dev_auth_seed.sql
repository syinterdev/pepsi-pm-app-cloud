-- 009 — ข้อมูลทดสอบ Auth (dev) — รันหลัง 008
-- psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f database/seeds/009_dev_auth_seed.sql
-- รหัสผ่าน plain จะถูกอัปเกรดเป็น bcrypt หลัง login ครั้งแรก

BEGIN;

INSERT INTO app.tbworkcenter (
  idwkctr, pass, wkctr, plnt,
  wkctrdate, startwork,
  titlewkctr, namewkctr, surnamewkctr,
  titlewkctreng, namewkctreng, surnamewkctreng,
  userst
) VALUES
  (
    'ADMIN01', 'admin', 'ADMIN01', '7151',
    631152000, 631152000,
    'นาย', 'ผู้ดูแล', 'ระบบ',
    'Mr.', 'Admin', 'User',
    'A'
  ),
  (
    'WC001', 'wc001', 'WC001', '7151',
    631152000, 946684800,
    'นาย', 'ช่าง', 'ทดสอบ',
    'Mr.', 'Tech', 'One',
    'W'
  )
ON CONFLICT (idwkctr) DO UPDATE SET
  pass = EXCLUDED.pass,
  namewkctr = EXCLUDED.namewkctr,
  userst = EXCLUDED.userst;

INSERT INTO app.tbl_member (username, password, fullname, idcard, bank, bank_no, branch, status)
VALUES
  ('demo', 'demo', 'สมาชิกทดสอบ', '1234567890123', 'ธนาคารทดสอบ', '123-4-56789-0', 'สาขาลำพูน', 'active')
ON CONFLICT (username) DO UPDATE SET
  fullname = EXCLUDED.fullname,
  idcard = EXCLUDED.idcard,
  bank = EXCLUDED.bank,
  bank_no = EXCLUDED.bank_no,
  branch = EXCLUDED.branch;

COMMIT;
