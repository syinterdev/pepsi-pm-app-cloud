ALTER TABLE app.tbzone
  ADD COLUMN IF NOT EXISTS zonedescrip text;

ALTER TABLE app.tbzone
  ADD COLUMN IF NOT EXISTS idproductline varchar(64);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'fk_tbzone_productline'
  ) THEN
    ALTER TABLE app.tbzone
      ADD CONSTRAINT fk_tbzone_productline
      FOREIGN KEY (idproductline)
      REFERENCES app.tbproductline (productline)
      ON DELETE SET NULL;
  END IF;
END $$;
