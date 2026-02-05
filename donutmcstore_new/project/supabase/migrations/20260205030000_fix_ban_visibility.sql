-- Fix: Allow users to check if they are banned
-- Previously, only admins could view the bans table, so regular users
-- couldn't check their own ban status

-- Allow authenticated users to see bans that apply to them
CREATE POLICY "Users can view bans that affect them"
  ON bans FOR SELECT
  TO authenticated
  USING (
    -- User can see bans matching their user_id (UUID as text)
    ban_value = auth.uid()::text 
    OR 
    -- User can see bans matching their discord_id
    ban_value IN (SELECT discord_id FROM users WHERE id = auth.uid())
  );

-- Allow anonymous users to check IP bans (for future IP-based bans)
CREATE POLICY "Anyone can view IP bans"
  ON bans FOR SELECT
  TO anon
  USING (ban_type = 'ip_address');

-- Note: The existing "Admins can view bans" policy remains, 
-- so admins can see ALL bans, while regular users only see their own
