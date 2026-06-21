-- 101 — Session สำหรับอัปรูป/comment ในแชท Telegram (Phase E / B2)
-- รัน: psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f database/migrations/101_telegram_chat_session.sql

BEGIN;

CREATE TABLE IF NOT EXISTS app.tbl_telegram_chat_session (
  telegram_chat_id bigint PRIMARY KEY,
  wkctr            varchar(32) NOT NULL,
  idiw37           integer NOT NULL REFERENCES app.tbiw37n(idiw37) ON DELETE CASCADE,
  idplanw          integer,
  pending_phase    varchar(8),
  pending_mode     varchar(16),
  updated_at       timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE app.tbl_telegram_chat_session IS
  'Per-chat WO context for Telegram photo/comment uploads (before/after/comment mode)';

COMMIT;
