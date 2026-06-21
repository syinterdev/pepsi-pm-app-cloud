-- 032_tbcofirm_import_uniq.sql
-- ปรับ unique index ของ app.tbcofirm ให้ตรงกับ semantics ของ M_Confirm.php (import)
--
-- เดิม (026_confirmation_tables.sql):
--   idx_tbcofirm_uniq (idiw37, wkctr) — บังคับ 1 แถวต่อ (WO, ช่าง)
--
-- ใหม่ (ตาม M_Confirm.php บรรทัด 130):
--   $SQLtw = "SELECT * FROM tbcofirm
--             WHERE confirmation = Row[0]
--               AND wkorder      = Row[3]
--               AND timeclose    = Row[11]
--               AND wkctr        = Row[6]"
--   → อนุญาตให้มีได้หลายแถวต่อ (idiw37, wkctr) ถ้า confirmation หรือ timeclose ต่างกัน
--
-- การเปลี่ยน index แบบนี้เป็น "กว้างกว่า" (subset constraint relax) ดังนั้นข้อมูลเก่า
-- ที่ผ่าน narrow uniq ได้อยู่แล้วจะไม่ขัด wider uniq นี้
DROP INDEX IF EXISTS app.idx_tbcofirm_uniq;

CREATE UNIQUE INDEX IF NOT EXISTS idx_tbcofirm_import_uniq
  ON app.tbcofirm (idiw37, wkctr, confirmation, timeclose);

-- index รองเพื่อช่วย lookup ตอน import (WO + ช่าง)
CREATE INDEX IF NOT EXISTS idx_tbcofirm_idiw37_wkctr
  ON app.tbcofirm (idiw37, wkctr);
