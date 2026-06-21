-- รันครั้งเดียวใน DBeaver ด้วย superuser postgres (127.0.0.1:5433 — PostgreSQL 11)
-- จากนั้น backend/.env: postgresql://pepsipm:pepsipm@127.0.0.1:5433/pepsi_pm

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'pepsipm') THEN
    CREATE ROLE pepsipm LOGIN PASSWORD 'pepsipm';
  ELSE
    ALTER ROLE pepsipm WITH LOGIN PASSWORD 'pepsipm';
  END IF;
END
$$;

-- ถ้ามี database pepsi_pm แล้ว ให้ข้ามคำสั่งถัดไป (จะ error ว่ามีอยู่แล้ว)
CREATE DATABASE pepsi_pm OWNER pepsipm;
