-- 093 — เมนู PM Vibration / บันทึกค่าวัด
-- รัน: psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f database/migrations/093_pm_vibration_menu.sql

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
  26,
  'item',
  'A:U:W',
  'fa-chart-line',
  'PM Vibration / บันทึกค่าวัด',
  '',
  '/pm-vibration',
  'pm-vibration',
  1,
  false
WHERE NOT EXISTS (
  SELECT 1 FROM app.tbmenu WHERE react_route = '/pm-vibration'
);

UPDATE app.tbmenu
SET
  menutitle = 'PM Vibration / บันทึกค่าวัด',
  menuright = 'A:U:W',
  menuon = 26
WHERE react_route = '/pm-vibration';
