-- 092 — PM execution: หมายเหตุต่อ WO + ค่าวัด (กระแส 3 เฟส / vibration)
-- รัน: psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f database/migrations/092_wo_pm_execution.sql

CREATE TABLE IF NOT EXISTS app.tbwo_pm_note (
  idiw37     integer PRIMARY KEY REFERENCES app.tbiw37n (idiw37) ON DELETE CASCADE,
  note       text    NOT NULL DEFAULT '',
  wkctr      varchar(64) NOT NULL DEFAULT '',
  updated_at timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE app.tbwo_pm_note IS 'Comments and findings ต่อ WO — แผน PM ออกมาแต่ไม่ได้ทำ/หมายเหตุการทำงาน';

CREATE TABLE IF NOT EXISTS app.tbwo_pm_reading (
  idreading    bigserial PRIMARY KEY,
  idiw37       integer NOT NULL REFERENCES app.tbiw37n (idiw37) ON DELETE CASCADE,
  machine      varchar(128) NOT NULL DEFAULT '',
  pmlist       varchar(128) NOT NULL DEFAULT '',
  kind         varchar(32) NOT NULL CHECK (kind IN ('current_3phase', 'vibration_3axis')),
  measured_at  timestamptz NOT NULL DEFAULT now(),
  v1           numeric(18, 3) NOT NULL,
  v2           numeric(18, 3) NOT NULL,
  v3           numeric(18, 3) NOT NULL,
  unit         varchar(16) NOT NULL DEFAULT '',
  warning_limit numeric(18, 3),
  alarm_limit   numeric(18, 3),
  wkctr        varchar(64) NOT NULL DEFAULT '',
  created_at   timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_tbwo_pm_reading_idiw37 ON app.tbwo_pm_reading (idiw37);
CREATE INDEX IF NOT EXISTS idx_tbwo_pm_reading_measured ON app.tbwo_pm_reading (idiw37, machine, pmlist, measured_at DESC);

COMMENT ON TABLE app.tbwo_pm_reading IS 'ค่าวัด PM ต่อรายการ task (หลายจุดเวลา → กราฟ trend)';
