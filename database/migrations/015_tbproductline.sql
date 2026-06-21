CREATE TABLE IF NOT EXISTS app.tbproductline (
  productline     varchar(64) PRIMARY KEY,
  prolinedescrip  text NOT NULL
);

INSERT INTO app.tbproductline (productline, prolinedescrip) VALUES
  ('PL01', 'Product line 01'),
  ('PL02', 'Product line 02')
ON CONFLICT (productline) DO NOTHING;
