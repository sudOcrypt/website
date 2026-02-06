CREATE TABLE IF NOT EXISTS invites (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  inviter_id TEXT NOT NULL,
  inviter_username TEXT NOT NULL,
  invited_id TEXT NOT NULL,
  invited_username TEXT NOT NULL,
  invite_code TEXT NOT NULL,
  joined_at TIMESTAMPTZ DEFAULT now(),
  valid_at TIMESTAMPTZ,
  is_valid BOOLEAN DEFAULT false,
  is_claimed BOOLEAN DEFAULT false,
  left_server BOOLEAN DEFAULT false,
  left_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS invite_claims (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id TEXT NOT NULL,
  discord_username TEXT NOT NULL,
  minecraft_username TEXT,
  invite_count INTEGER NOT NULL,
  reward_amount INTEGER NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'denied')),
  admin_notes TEXT,
  processed_by TEXT,
  processed_at TIMESTAMPTZ,
  claimed_at TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS invite_settings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  reward_per_invite INTEGER DEFAULT 250000,
  minimum_invites INTEGER DEFAULT 3,
  validation_hours INTEGER DEFAULT 5,
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_invites_inviter ON invites(inviter_id);
CREATE INDEX idx_invites_invited ON invites(invited_id);
CREATE INDEX idx_invites_valid ON invites(is_valid, is_claimed);
CREATE INDEX idx_invite_claims_user ON invite_claims(user_id);
CREATE INDEX idx_invite_claims_status ON invite_claims(status);

ALTER TABLE invites ENABLE ROW LEVEL SECURITY;
ALTER TABLE invite_claims ENABLE ROW LEVEL SECURITY;
ALTER TABLE invite_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view their own invites"
  ON invites FOR SELECT
  USING (inviter_id = auth.jwt() ->> 'sub' OR true);

CREATE POLICY "Anyone can view their own claims"
  ON invite_claims FOR SELECT
  USING (user_id = auth.jwt() ->> 'sub' OR true);

CREATE POLICY "Admins can manage invites"
  ON invites FOR ALL
  USING (EXISTS (
    SELECT 1 FROM users WHERE users.id = auth.uid() AND users.is_admin = true
  ));

CREATE POLICY "Admins can manage claims"
  ON invite_claims FOR ALL
  USING (EXISTS (
    SELECT 1 FROM users WHERE users.id = auth.uid() AND users.is_admin = true
  ));

CREATE POLICY "Admins can view settings"
  ON invite_settings FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM users WHERE users.id = auth.uid() AND users.is_admin = true
  ));

CREATE POLICY "Admins can update settings"
  ON invite_settings FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM users WHERE users.id = auth.uid() AND users.is_admin = true
  ));

INSERT INTO invite_settings (reward_per_invite, minimum_invites, validation_hours) 
VALUES (250000, 3, 5)
ON CONFLICT DO NOTHING;
