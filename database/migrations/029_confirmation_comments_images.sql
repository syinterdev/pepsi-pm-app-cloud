-- 029 — Confirmation: comments + images (parity W_confirm_form*)
-- รัน: psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f database/migrations/029_confirmation_comments_images.sql

CREATE TABLE IF NOT EXISTS app.tbconfirmcom (
  idcom      bigserial PRIMARY KEY,
  idiw37     integer NOT NULL REFERENCES app.tbiw37n (idiw37) ON DELETE CASCADE,
  comdetail  text    NOT NULL,
  wkctr      varchar(64) NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_tbconfirmcom_idiw37 ON app.tbconfirmcom (idiw37);
CREATE INDEX IF NOT EXISTS idx_tbconfirmcom_created_at ON app.tbconfirmcom (created_at DESC);

CREATE TABLE IF NOT EXISTS app.tbconfirmimg (
  idcimg      bigserial PRIMARY KEY,
  idiw37      integer NOT NULL REFERENCES app.tbiw37n (idiw37) ON DELETE CASCADE,
  cfilename   text    NOT NULL,
  original    text    NOT NULL DEFAULT '',
  mime        varchar(64) NOT NULL DEFAULT 'image/jpeg',
  bytes       integer NOT NULL DEFAULT 0,
  wkctr       varchar(64) NOT NULL DEFAULT '',
  created_at  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_tbconfirmimg_idiw37 ON app.tbconfirmimg (idiw37);
CREATE INDEX IF NOT EXISTS idx_tbconfirmimg_created_at ON app.tbconfirmimg (created_at DESC);
