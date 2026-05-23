/*
  # Pieces per storage unit (e.g. pieces in one carton)

  quantity in products is always stored in sellable pieces (قطع).
  pieces_per_unit defines how many pieces are in one storage unit (كرتون، باكت، ...).
*/

ALTER TABLE products
  ADD COLUMN IF NOT EXISTS pieces_per_unit integer NOT NULL DEFAULT 1
  CHECK (pieces_per_unit >= 1);

COMMENT ON COLUMN products.pieces_per_unit IS 'Number of sellable pieces in one storage unit; 1 when sold/stored as قطعة';
