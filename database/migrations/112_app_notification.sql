-- 112 — In-app notifications + close_to_planner Telegram kind
-- รัน: psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f database/migrations/112_app_notification.sql

BEGIN;

CREATE TABLE IF NOT EXISTS app.tbl_app_notification (
  id              serial PRIMARY KEY,
  notify_kind     varchar(32) NOT NULL,
  audience        varchar(16) NOT NULL DEFAULT 'planner',
  recipient_wkctr varchar(32),
  idiw37          integer REFERENCES app.tbiw37n (idiw37) ON DELETE CASCADE,
  title           text NOT NULL,
  body            text,
  link_route      text,
  read_at         timestamptz,
  created_at      timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_app_notification_recipient_unread
  ON app.tbl_app_notification (recipient_wkctr, read_at, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_app_notification_audience_unread
  ON app.tbl_app_notification (audience, read_at, created_at DESC);

COMMENT ON TABLE app.tbl_app_notification IS
  'In-app notifications — planner close QC queue, assignment ack, etc.';

COMMENT ON COLUMN app.tbl_app_notification.audience IS
  'planner = visible to users with confirmation.import; wkctr = single recipient';

COMMIT;
