-- Remove category constraint to allow dynamic categories
ALTER TABLE products DROP CONSTRAINT IF EXISTS products_category_check;

-- Add a simple NOT NULL constraint (optional, but keeps data integrity)
ALTER TABLE products ALTER COLUMN category SET NOT NULL;

-- Add comment
COMMENT ON COLUMN products.category IS 'Product category - can be any string (coins, items, bases, weapons, armor, ranks, etc.)';
