-- 037 — เพิ่มเมนู "Personnel Confirmation" (M_personel_confirm.php) ใน tbmenu
-- Admin only — แสดง % การปิดงานของช่างต่อ WO (ดู view_countpersonelclose)

INSERT INTO app.tbmenu (
  idmenusub, menuon, menu_kind, menuright, menuicon,
  menutitle, menulink, react_route, menuname, menulavel, end_exact
)
SELECT '0', 231, 'item', 'A', 'fa-user-check',
       'Personnel Confirmation', 'index2.php?module=M_personel_confirm',
       '/personnel/confirm', 'personnel-confirm', 1, false
WHERE NOT EXISTS (
  SELECT 1 FROM app.tbmenu
  WHERE menulink = 'index2.php?module=M_personel_confirm'
     OR react_route = '/personnel/confirm'
);

UPDATE app.tbmenu
SET menuright = 'A',
    menutitle = 'Personnel Confirmation'
WHERE react_route = '/personnel/confirm';

SELECT setval(
  pg_get_serial_sequence('app.tbmenu', 'idmenu'),
  (SELECT COALESCE(MAX(idmenu), 1) FROM app.tbmenu)
);
