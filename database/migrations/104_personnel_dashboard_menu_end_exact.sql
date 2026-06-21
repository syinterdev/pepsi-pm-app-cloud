-- 104 — Personal Dashboard (/personnel) ไม่ควร active เมื่ออยู่ /personnel/confirm หรือ /personnel/admin
-- ตรงกับ NavLink `end` (U4g.10 sibling routes)

UPDATE app.tbmenu
SET end_exact = true
WHERE react_route = '/personnel';
