-- Fix infinite recursion in RLS policies by using a helper function
-- The issue: Admin policies were querying the same table they were protecting

-- Create a helper function to check if current user is admin
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN (
    SELECT is_admin 
    FROM public.users 
    WHERE id = auth.uid()
    LIMIT 1
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Drop existing problematic policies
DROP POLICY IF EXISTS "Admins can view all users" ON users;
DROP POLICY IF EXISTS "Admins can view all products" ON products;
DROP POLICY IF EXISTS "Admins can insert products" ON products;
DROP POLICY IF EXISTS "Admins can update products" ON products;
DROP POLICY IF EXISTS "Admins can delete products" ON products;
DROP POLICY IF EXISTS "Admins can view all orders" ON orders;
DROP POLICY IF EXISTS "Admins can update orders" ON orders;
DROP POLICY IF EXISTS "Admins can view all order items" ON order_items;
DROP POLICY IF EXISTS "Admins can view all reviews" ON reviews;
DROP POLICY IF EXISTS "Admins can update reviews" ON reviews;
DROP POLICY IF EXISTS "Admins can delete reviews" ON reviews;
DROP POLICY IF EXISTS "Admins can view all schematics" ON schematics;
DROP POLICY IF EXISTS "Admins can update schematics" ON schematics;
DROP POLICY IF EXISTS "Admins can delete schematics" ON schematics;
DROP POLICY IF EXISTS "Admins can view all login logs" ON login_logs;
DROP POLICY IF EXISTS "Admins can view bans" ON bans;
DROP POLICY IF EXISTS "Admins can insert bans" ON bans;
DROP POLICY IF EXISTS "Admins can delete bans" ON bans;
DROP POLICY IF EXISTS "Admins can view notifications" ON admin_notifications;
DROP POLICY IF EXISTS "Admins can update notifications" ON admin_notifications;
DROP POLICY IF EXISTS "Admins can delete notifications" ON admin_notifications;

-- Recreate policies using the helper function (no more recursion!)

-- Users table
CREATE POLICY "Admins can view all users"
  ON users FOR SELECT
  TO authenticated
  USING (is_admin());

-- Products table
CREATE POLICY "Admins can view all products"
  ON products FOR SELECT
  TO authenticated
  USING (is_admin());

CREATE POLICY "Admins can insert products"
  ON products FOR INSERT
  TO authenticated
  WITH CHECK (is_admin());

CREATE POLICY "Admins can update products"
  ON products FOR UPDATE
  TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());

CREATE POLICY "Admins can delete products"
  ON products FOR DELETE
  TO authenticated
  USING (is_admin());

-- Orders table
CREATE POLICY "Admins can view all orders"
  ON orders FOR SELECT
  TO authenticated
  USING (is_admin());

CREATE POLICY "Admins can update orders"
  ON orders FOR UPDATE
  TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());

-- Order items table
CREATE POLICY "Admins can view all order items"
  ON order_items FOR SELECT
  TO authenticated
  USING (is_admin());

-- Reviews table
CREATE POLICY "Admins can view all reviews"
  ON reviews FOR SELECT
  TO authenticated
  USING (is_admin());

CREATE POLICY "Admins can update reviews"
  ON reviews FOR UPDATE
  TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());

CREATE POLICY "Admins can delete reviews"
  ON reviews FOR DELETE
  TO authenticated
  USING (is_admin());

-- Schematics table
CREATE POLICY "Admins can view all schematics"
  ON schematics FOR SELECT
  TO authenticated
  USING (is_admin());

CREATE POLICY "Admins can update schematics"
  ON schematics FOR UPDATE
  TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());

CREATE POLICY "Admins can delete schematics"
  ON schematics FOR DELETE
  TO authenticated
  USING (is_admin());

-- Login logs table
CREATE POLICY "Admins can view all login logs"
  ON login_logs FOR SELECT
  TO authenticated
  USING (is_admin());

-- Bans table
CREATE POLICY "Admins can view bans"
  ON bans FOR SELECT
  TO authenticated
  USING (is_admin());

CREATE POLICY "Admins can insert bans"
  ON bans FOR INSERT
  TO authenticated
  WITH CHECK (is_admin());

CREATE POLICY "Admins can delete bans"
  ON bans FOR DELETE
  TO authenticated
  USING (is_admin());

-- Admin notifications table
CREATE POLICY "Admins can view notifications"
  ON admin_notifications FOR SELECT
  TO authenticated
  USING (is_admin());

CREATE POLICY "Admins can update notifications"
  ON admin_notifications FOR UPDATE
  TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());

CREATE POLICY "Admins can delete notifications"
  ON admin_notifications FOR DELETE
  TO authenticated
  USING (is_admin());

-- Grant execute permission on the helper function
GRANT EXECUTE ON FUNCTION is_admin() TO authenticated;
GRANT EXECUTE ON FUNCTION is_admin() TO anon;

COMMENT ON FUNCTION is_admin() IS 'Helper function to check if current user is an admin without causing RLS recursion';
