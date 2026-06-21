-- 038 — Multi-assign บน tbplangingwork (เทียบ legacy `AddPlan.php` ที่อนุญาตช่างหลายคน/WO)
-- รัน: psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f database/migrations/038_tbplangingwork_multi_assign.sql
--
-- เปลี่ยน unique index จาก (idiw37) → (idiw37, wkctr) เพื่อให้ INSERT ได้หลายแถวต่อ 1 WO
-- (เก็บได้ว่ามีช่างคนใดบ้างถูก plan ใน WO นั้น เทียบ "INSERT INTO tbplangingwork ... where idiw37=$1 and wkctr=$2")

BEGIN;

DROP INDEX IF EXISTS app.idx_tbplangingwork_idiw37;

CREATE UNIQUE INDEX IF NOT EXISTS idx_tbplangingwork_idiw37_wkctr
  ON app.tbplangingwork (idiw37, wkctr);

-- ดัชนีช่วยค้นหา WO ตาม wkctr (technician เห็นรายการของตน — เทียบ W_planwork_view.php)
CREATE INDEX IF NOT EXISTS idx_tbplangingwork_wkctr
  ON app.tbplangingwork (wkctr);

COMMIT;

COMMENT ON INDEX app.idx_tbplangingwork_idiw37_wkctr IS
  'Multi-assign: 1 WO มอบหมายช่างหลายคนได้ (idiw37, wkctr) — เทียบ AddPlan.php';
