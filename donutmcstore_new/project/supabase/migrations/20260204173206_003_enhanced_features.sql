/*
  # Enhanced Features Migration

  ## Overview
  Adds support for user bans, admin notifications, refunded order status,
  customer-gated reviews, and dynamic categories.

  ## New Tables

  1. `bans` - Stores all types of user bans
     - `id` (uuid, primary key)
     - `ban_type` (text) - discord_id, user_id, ip_address
     - `ban_value` (text) - The value being banned
     - `reason` (text) - Why the user was banned
     - `banned_by` (uuid) - Admin who issued the ban
     - `expires_at` (timestamptz) - Optional expiration
     - `created_at` (timestamptz)

  2. `admin_notifications` - Notifications for admin panel
     - `id` (uuid, primary key)
     - `type` (text) - new_order, new_schematic, etc.
     - `title` (text)
     - `message` (text)
     - `reference_id` (uuid) - Related order/schematic ID
     - `is_read` (boolean)
     - `created_at` (timestamptz)

  3. `categories` - Dynamic product categories
     - `id` (uuid, primary key)
     - `slug` (text) - URL-friendly identifier
     - `name` (text)
     - `description` (text)
     - `sort_order` (integer)
     - `is_active` (boolean)
     - `created_at` (timestamptz)

  ## Modified Tables

  1. `users` - Added email field
  2. `orders` - Added refunded status, stripe_session_id, discord_id
  3. `reviews` - Added order_id for customer gating

  ## Security
  - RLS enabled on all new tables
  - Proper admin-only access policies
*/

-- Add email field to users
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'users' AND column_name = 'email'
  ) THEN
    ALTER TABLE users ADD COLUMN email text;
  END IF;
END $$;

-- Modify orders status to include 'refunded'
ALTER TABLE orders DROP CONSTRAINT IF EXISTS orders_status_check;
ALTER TABLE orders ADD CONSTRAINT orders_status_check 
  CHECK (status IN ('pending', 'processing', 'completed', 'cancelled', 'refunded'));

-- Add stripe_session_id to orders
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'orders' AND column_name = 'stripe_session_id'
  ) THEN
    ALTER TABLE orders ADD COLUMN stripe_session_id text;
  END IF;
END $$;

-- Add discord_id to orders for reference
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'orders' AND column_name = 'discord_id'
  ) THEN
    ALTER TABLE orders ADD COLUMN discord_id text;
  END IF;
END $$;

-- Add order_id to reviews for customer gating
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'reviews' AND column_name = 'order_id'
  ) THEN
    ALTER TABLE reviews ADD COLUMN order_id uuid REFERENCES orders(id);
  END IF;
END $$;

-- Create bans table
CREATE TABLE IF NOT EXISTS bans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ban_type text NOT NULL CHECK (ban_type IN ('discord_id', 'user_id', 'ip_address')),
  ban_value text NOT NULL,
  reason text,
  banned_by uuid REFERENCES users(id),
  expires_at timestamptz,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE bans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view all bans"
  ON bans FOR SELECT
  TO authenticated
  USING (EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND is_admin = true));

CREATE POLICY "Admins can insert bans"
  ON bans FOR INSERT
  TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND is_admin = true));

CREATE POLICY "Admins can update bans"
  ON bans FOR UPDATE
  TO authenticated
  USING (EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND is_admin = true))
  WITH CHECK (EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND is_admin = true));

CREATE POLICY "Admins can delete bans"
  ON bans FOR DELETE
  TO authenticated
  USING (EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND is_admin = true));

CREATE INDEX IF NOT EXISTS idx_bans_type_value ON bans(ban_type, ban_value);
CREATE INDEX IF NOT EXISTS idx_bans_expires_at ON bans(expires_at);

-- Create admin notifications table
CREATE TABLE IF NOT EXISTS admin_notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  type text NOT NULL CHECK (type IN ('new_order', 'new_schematic', 'new_review', 'payment_failed')),
  title text NOT NULL,
  message text,
  reference_id uuid,
  is_read boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE admin_notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view notifications"
  ON admin_notifications FOR SELECT
  TO authenticated
  USING (EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND is_admin = true));

CREATE POLICY "Admins can update notifications"
  ON admin_notifications FOR UPDATE
  TO authenticated
  USING (EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND is_admin = true))
  WITH CHECK (EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND is_admin = true));

CREATE POLICY "Admins can delete notifications"
  ON admin_notifications FOR DELETE
  TO authenticated
  USING (EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND is_admin = true));

CREATE POLICY "Service role can insert notifications"
  ON admin_notifications FOR INSERT
  WITH CHECK (true);

CREATE INDEX IF NOT EXISTS idx_admin_notifications_is_read ON admin_notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_admin_notifications_created_at ON admin_notifications(created_at DESC);

-- Create categories table
CREATE TABLE IF NOT EXISTS categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text UNIQUE NOT NULL,
  name text NOT NULL,
  description text,
  sort_order integer DEFAULT 0,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active categories"
  ON categories FOR SELECT
  USING (is_active = true);

CREATE POLICY "Admins can view all categories"
  ON categories FOR SELECT
  TO authenticated
  USING (EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND is_admin = true));

CREATE POLICY "Admins can insert categories"
  ON categories FOR INSERT
  TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND is_admin = true));

CREATE POLICY "Admins can update categories"
  ON categories FOR UPDATE
  TO authenticated
  USING (EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND is_admin = true))
  WITH CHECK (EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND is_admin = true));

CREATE POLICY "Admins can delete categories"
  ON categories FOR DELETE
  TO authenticated
  USING (EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND is_admin = true));

-- Insert default categories
INSERT INTO categories (slug, name, description, sort_order)
VALUES 
  ('coins', 'Coins', 'In-game currency', 1),
  ('items', 'Items', 'Valuable items and gear', 2),
  ('bases', 'Bases', 'Pre-built bases and structures', 3)
ON CONFLICT (slug) DO NOTHING;

-- Function to check if user is banned
CREATE OR REPLACE FUNCTION is_user_banned(
  check_user_id uuid DEFAULT NULL,
  check_discord_id text DEFAULT NULL,
  check_ip text DEFAULT NULL
)
RETURNS boolean AS $$
DECLARE
  is_banned boolean := false;
BEGIN
  SELECT EXISTS (
    SELECT 1 FROM bans
    WHERE (
      (ban_type = 'user_id' AND ban_value = check_user_id::text)
      OR (ban_type = 'discord_id' AND ban_value = check_discord_id)
      OR (ban_type = 'ip_address' AND ban_value = check_ip)
    )
    AND (expires_at IS NULL OR expires_at > now())
  ) INTO is_banned;
  
  RETURN is_banned;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if user is a customer (has completed orders)
CREATE OR REPLACE FUNCTION is_customer(check_user_id uuid)
RETURNS boolean AS $$
DECLARE
  has_orders boolean := false;
BEGIN
  SELECT EXISTS (
    SELECT 1 FROM orders
    WHERE user_id = check_user_id
    AND status = 'completed'
  ) INTO has_orders;
  
  RETURN has_orders;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update reviews policy to require customer status for inserting
DROP POLICY IF EXISTS "Users can insert own reviews" ON reviews;
CREATE POLICY "Customers can insert own reviews"
  ON reviews FOR INSERT
  TO authenticated
  WITH CHECK (
    user_id = auth.uid() 
    AND is_customer(auth.uid())
  );

-- Policy for admins to delete reviews
CREATE POLICY "Admins can delete reviews"
  ON reviews FOR DELETE
  TO authenticated
  USING (EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND is_admin = true));