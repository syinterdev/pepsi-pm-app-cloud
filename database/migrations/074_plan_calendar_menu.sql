-- 074 — เมนู Plan Calendar (M_plan_calendar.php → /plan-calendar) หลังเลือก 0A
-- รัน: psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f database/migrations/074_plan_calendar_menu.sql

INSERT INTO app.tbmenu (
  idmenusub,
  menuon,
  menu_kind,
  menuright,
  menuicon,
  menutitle,
  menulink,
  react_route,
  menuname,
  menulavel,
  end_exact
)
SELECT
  '0',
  25,
  'item',
  'A:U:W',
  'fa-calendar-check',
  'Plan Calendar / จ่ายงาน',
  'index2.php?module=M_plan_calendar',
  '/plan-calendar',
  'plan-calendar',
  1,
  false
WHERE NOT EXISTS (
  SELECT 1 FROM app.tbmenu WHERE react_route = '/plan-calendar'
);

UPDATE app.tbmenu
SET
  menutitle = 'Plan Calendar / จ่ายงาน',
  menuright = 'A:U:W',
  menuon = 25,
  menulink = COALESCE(NULLIF(menulink, ''), 'index2.php?module=M_plan_calendar')
WHERE react_route = '/plan-calendar';
