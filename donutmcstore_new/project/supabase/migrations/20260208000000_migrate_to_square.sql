/*
  # Migrate from Stripe to Square

  ## Overview
  Renames Stripe-related columns to Square equivalents.

  ## Changes
  1. `products` table:
     - stripe_product_id → square_catalog_object_id
     - stripe_price_id → square_variation_id
  
  2. `orders` table:
     - stripe_session_id → square_checkout_id

  ## Notes
  - Data is preserved during column renaming
  - Indexes are updated to reflect new column names
*/

-- Rename columns in products table
ALTER TABLE products 
  RENAME COLUMN stripe_product_id TO square_catalog_object_id;

ALTER TABLE products 
  RENAME COLUMN stripe_price_id TO square_variation_id;

-- Rename column in orders table
ALTER TABLE orders 
  RENAME COLUMN stripe_session_id TO square_checkout_id;

-- Drop the old Stripe index
DROP INDEX IF EXISTS idx_products_stripe_product_id;

-- Create new Square index
CREATE INDEX IF NOT EXISTS idx_products_square_catalog_object_id 
  ON products(square_catalog_object_id);

-- Add helpful comments
COMMENT ON COLUMN products.square_catalog_object_id IS 'Square Catalog Item Object ID for syncing';
COMMENT ON COLUMN products.square_variation_id IS 'Square Catalog Item Variation ID (represents pricing tier)';
COMMENT ON COLUMN orders.square_checkout_id IS 'Square Checkout session/payment ID';
