-- 100 — One-time tokens สำหรับผูก Telegram ↔ wkctr (/start <token>)
-- รัน: psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f database/migrations/100_telegram_link_token.sql

BEGIN;

CREATE TABLE IF NOT EXISTS app.tbl_telegram_link_token (
  id           serial PRIMARY KEY,
  token_hash   char(64) NOT NULL UNIQUE,
  idwkctr      varchar(64) NOT NULL,
  created_by   varchar(64),
  expires_at   timestamptz NOT NULL,
  used_at      timestamptz,
  used_chat_id bigint,
  created_at   timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_telegram_link_token_idwkctr
  ON app.tbl_telegram_link_token (idwkctr);

CREATE INDEX IF NOT EXISTS idx_telegram_link_token_expires
  ON app.tbl_telegram_link_token (expires_at)
  WHERE used_at IS NULL;

COMMENT ON TABLE app.tbl_telegram_link_token IS
  'Single-use invite tokens for Telegram /start linking (Phase D)';

COMMIT;
