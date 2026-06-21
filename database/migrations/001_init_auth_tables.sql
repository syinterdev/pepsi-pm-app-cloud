-- 001 — schema แอป + ตารางขั้นต่ำสำหรับ auth (เทียบ login.php / logout.php บน MySQL sap_lay)
-- หมายเหตุ: ชนิดข้อมูลเป็นร่างจากการใช้งานใน PHP; หลังได้ SHOW CREATE TABLE จาก MySQL ให้ปรับให้ตรง DDL จริง
-- รัน: psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f migrations/001_init_auth_tables.sql

CREATE SCHEMA IF NOT EXISTS app;

-- ตารางหลักผู้ใช้งาน / work center (login: WHERE idwkctr = $user AND pass = $pass)
-- wkctrdate / startwork ใน PHP ใช้กับ date() แบบ unix timestamp — ใช้ BIGINT ชั่วคราว; ถ้า MySQL เป็น DATE ให้เปลี่ยนเป็น date
CREATE TABLE IF NOT EXISTS app.tbworkcenter (
  idwkctr         varchar(64) PRIMARY KEY,
  pass            text        NOT NULL,
  wkctr           varchar(64) NOT NULL,
  plnt            varchar(32),
  wkctrdate       bigint,
  startwork       bigint,
  titlewkctr      text,
  namewkctr       text,
  surnamewkctr    text,
  titlewkctreng   text,
  namewkctreng    text,
  surnamewkctreng text,
  idwkctrgroup    varchar(64),
  idwkctrtype     varchar(64),
  idposition      varchar(64),
  iddepartment    varchar(64),
  userst          char(1)     NOT NULL DEFAULT 'U',
  imgmember       text,
  workstatus      varchar(64),
  last_login      timestamptz
);

CREATE INDEX IF NOT EXISTS idx_tbworkcenter_wkctr ON app.tbworkcenter (wkctr);

-- log login/logout (PHP: insert into tbworkcenter_userlog(userId,username,userIp,myIp,action))
CREATE TABLE IF NOT EXISTS app.tbworkcenter_userlog (
  id         bigserial PRIMARY KEY,
  user_id    text        NOT NULL,
  username   text        NOT NULL,
  user_ip    text,
  my_ip      text,
  action     text        NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_tbworkcenter_userlog_created ON app.tbworkcenter_userlog (created_at DESC);

COMMENT ON SCHEMA app IS 'PM app tables (migrated from MySQL sap_lay; names aligned with legacy PHP)';
COMMENT ON TABLE app.tbworkcenter IS 'Legacy tbworkcenter — auth fields used by sap/pages/login.php';
COMMENT ON TABLE app.tbworkcenter_userlog IS 'Legacy tbworkcenter_userlog — login in / logout out';
