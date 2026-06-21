-- 011 — ชั่วโมงทดสอบ (หลัง migration 010 + seed 009)
-- psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f database/seeds/011_dev_manhours_seed.sql

BEGIN;

INSERT INTO app.tbmanhours (idwkctr, stworkday, workday, wh, ot1, ot15, ot1hol, ot2, ot3)
SELECT v.idwkctr, v.workday, v.workday, v.wh, v.ot1, v.ot15, v.ot1hol, v.ot2, v.ot3
FROM (
  VALUES
    ('WC001', EXTRACT(EPOCH FROM (CURRENT_DATE - INTERVAL '7 day'))::bigint, 8, 1, 0, 0, 0, 0),
    ('WC001', EXTRACT(EPOCH FROM (CURRENT_DATE - INTERVAL '3 day'))::bigint, 7.5, 0, 1.5, 0, 0, 0),
    ('WC001', EXTRACT(EPOCH FROM CURRENT_DATE)::bigint, 8, 2, 0, 0, 0, 0),
    ('ADMIN01', EXTRACT(EPOCH FROM CURRENT_DATE)::bigint, 8, 0, 0, 0, 0, 0)
) AS v(idwkctr, workday, wh, ot1, ot15, ot1hol, ot2, ot3)
WHERE EXISTS (SELECT 1 FROM app.tbworkcenter w WHERE w.idwkctr = v.idwkctr)
  AND NOT EXISTS (
    SELECT 1 FROM app.tbmanhours m
    WHERE m.idwkctr = v.idwkctr AND m.workday = v.workday
  );

COMMIT;
