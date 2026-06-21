-- 090 — ลูกค้าไม่ใช้หน้า /line-calendar แล้ว — เอาออกจาก sidebar (tbmenu)
-- รัน: psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f database/migrations/090_remove_line_calendar_menu.sql

DELETE FROM app.tbmenu
WHERE react_route = '/line-calendar'
   OR menulink ILIKE '%module=line_calendar%'
   OR menutitle ILIKE '%ปฏิทินเส้น%';
