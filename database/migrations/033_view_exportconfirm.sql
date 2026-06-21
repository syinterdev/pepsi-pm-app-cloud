CREATE OR REPLACE VIEW app.view_exportconfirm AS
SELECT
  c.idclose,
  c.idiw37,
  c.confirmation,
  c.wkctr,
  c.stdate,
  c.endate,
  c.cwkctr,
  c.timeclose,
  c.timewk,
  c.unitc,
  i.wkorder,
  i.opac,
  i.syst,
  i.wktype
FROM app.tbcofirm c
JOIN app.tbiw37n i ON i.idiw37 = c.idiw37;

