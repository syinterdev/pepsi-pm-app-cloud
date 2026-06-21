-- 107 — Rename sidebar menu label for /master-data → Master Plan

UPDATE app.tbmenu
SET menutitle = 'Master Plan'
WHERE react_route = '/master-data';
