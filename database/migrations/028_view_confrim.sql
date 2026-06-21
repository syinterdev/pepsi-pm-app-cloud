CREATE OR REPLACE VIEW app.view_confrim AS
SELECT
  i.idiw37,
  i.mntplan,
  i.wkorder,
  i.wktype,
  i.mat,
  i.bscstart,
  i.actfinish,
  i.systemstatus,
  i.syst,
  i.opac,
  i.operationshorttext,
  i.ostdescription,
  i.cknow,
  i.wkctr,
  i.work,
  i.actwork,
  i.untime,
  i.equipment,
  i.equdescrip,
  i.functionalloc,
  i.funcdescrip,
  i.team,
  c.idclose,
  c.confirmation,
  c.wkctr AS wkctrcon,
  c.stdate,
  c.endate,
  c.cwkctr,
  c.timeclose,
  c.timewk,
  c.unitc,
  wc.titlewkctr,
  wc.namewkctr,
  wc.surnamewkctr,
  wc.titlewkctreng,
  wc.namewkctreng,
  wc.surnamewkctreng,
  wc.startwork,
  wc.idposition,
  wc.iddepartment,
  wc.idwkctrgroup,
  wc.idwkctrtype,
  mp.idmoveplan,
  mp.cday,
  mp.mday,
  mp.mwkctr,
  mp.reasoncode,
  r.reasonname,
  mp.resoncom,
  mp.mpcount,
  ws.wkstcolor,
  ws.wkstreason
FROM app.tbiw37n i
LEFT JOIN LATERAL (
  SELECT
    idclose,
    idiw37,
    confirmation,
    wkctr,
    stdate,
    endate,
    cwkctr,
    timeclose,
    timewk,
    unitc
  FROM app.tbcofirm
  WHERE idiw37 = i.idiw37
  ORDER BY endate DESC, idclose DESC
  LIMIT 1
) c ON true
LEFT JOIN app.tbworkcenter wc ON wc.wkctr = c.wkctr
LEFT JOIN app.tbmoveplan mp ON mp.idiw37 = i.idiw37
LEFT JOIN app.tbreason r ON r.reasoncode = mp.reasoncode
LEFT JOIN app.tbwkstatus ws ON ws.syst = i.syst;
