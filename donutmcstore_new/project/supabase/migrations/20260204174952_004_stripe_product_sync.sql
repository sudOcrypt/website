/*
  # Stripe Product Sync

  ## Overview
  Adds columns to products table to support automatic syncing with Stripe.

  ## Modified Tables
  1. `products` - Added Stripe-related columns
     - `stripe_product_id` (text) - Stripe product ID for syncing
     - `stripe_price_id` (text) - Stripe price ID for checkout

  ## Security
  - No RLS changes needed, existing policies apply
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'products' AND column_name = 'stripe_product_id'
  ) THEN
    ALTER TABLE products ADD COLUMN stripe_product_id text UNIQUE;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'products' AND column_name = 'stripe_price_id'
  ) THEN
    ALTER TABLE products ADD COLUMN stripe_price_id text;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_products_stripe_product_id ON products(stripe_product_id);