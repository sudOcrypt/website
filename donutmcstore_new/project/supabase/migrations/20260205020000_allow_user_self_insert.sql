-- Fix: Allow users to insert their own profile on first Discord login
-- Without this, new users get 403 Forbidden when trying to create their profile

CREATE POLICY "Users can insert own profile on signup"
  ON users FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- This policy allows authenticated users to create their own user record
-- when they first sign in with Discord OAuth
