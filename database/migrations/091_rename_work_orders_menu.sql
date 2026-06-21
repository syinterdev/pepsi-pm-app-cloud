-- 091 — เปลี่ยนชื่อเมนูใบงานเป็น WO/Confirmation
-- รัน: psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f database/migrations/091_rename_work_orders_menu.sql

UPDATE app.tbmenu
SET menutitle = 'WO/Confirmation'
WHERE react_route = '/work-orders'
   OR menulink ILIKE '%module=workorder%';
