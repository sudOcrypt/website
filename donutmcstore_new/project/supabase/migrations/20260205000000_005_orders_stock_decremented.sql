-- Add stock_decremented flag for idempotent webhook processing
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'orders' AND column_name = 'stock_decremented'
  ) THEN
    ALTER TABLE orders ADD COLUMN stock_decremented boolean DEFAULT false;
  END IF;
END $$;

-- Atomic stock decrement (only decrements when stock >= quantity; prevents negative stock)
CREATE OR REPLACE FUNCTION decrement_product_stock(p_product_id uuid, p_quantity integer)
RETURNS void AS $$
BEGIN
  UPDATE products SET stock = stock - p_quantity
  WHERE id = p_product_id AND stock >= p_quantity;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
