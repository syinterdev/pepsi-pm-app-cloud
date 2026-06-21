-- 097 — PM comment thread: หลาย comment ต่อ WO (append-only)
-- รัน: psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f database/migrations/097_tbwo_pm_note_entry.sql

CREATE TABLE IF NOT EXISTS app.tbwo_pm_note_entry (
  identry     bigserial PRIMARY KEY,
  idiw37      integer NOT NULL REFERENCES app.tbiw37n (idiw37) ON DELETE CASCADE,
  note        text    NOT NULL DEFAULT '',
  wkctr       varchar(64) NOT NULL DEFAULT '',
  created_by  varchar(128) NOT NULL DEFAULT '',
  created_at  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_tbwo_pm_note_entry_idiw37
  ON app.tbwo_pm_note_entry (idiw37, created_at ASC, identry ASC);

COMMENT ON TABLE app.tbwo_pm_note_entry IS 'ประวัติ Comments and Findings PM ต่อ WO — append-only';

INSERT INTO app.tbwo_pm_note_entry (idiw37, note, wkctr, created_by, created_at)
SELECT n.idiw37, n.note, n.wkctr, n.wkctr, n.updated_at
FROM app.tbwo_pm_note n
WHERE btrim(n.note) <> '';
