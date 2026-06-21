CREATE UNIQUE INDEX IF NOT EXISTS idx_tblineschdul_uniq
ON app.tblineschdul (idproductline, lineday);
