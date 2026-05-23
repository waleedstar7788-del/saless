/*
  # Add unit field to products

  Allows specifying measurement unit per product (piece, kg, liter, etc.)
*/

ALTER TABLE products
  ADD COLUMN IF NOT EXISTS unit text NOT NULL DEFAULT 'قطعة';

COMMENT ON COLUMN products.unit IS 'Measurement unit for product quantity (e.g. قطعة, كغ, لتر)';

-- Set units for sample products where applicable
UPDATE products SET unit = 'لتر' WHERE name LIKE '%لتر%';
UPDATE products SET unit = 'كغ' WHERE name LIKE '%كغ%';
UPDATE products SET unit = 'غ' WHERE name LIKE '%غ' AND name NOT LIKE '%كغ%';
UPDATE products SET unit = 'بطل' WHERE name LIKE '% بطل%' OR name LIKE '%بطل %';
UPDATE products SET unit = 'علبة' WHERE name LIKE '%علب%';
