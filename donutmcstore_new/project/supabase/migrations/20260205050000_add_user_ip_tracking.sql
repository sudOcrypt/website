-- Add IP tracking fields to users table
ALTER TABLE users
ADD COLUMN IF NOT EXISTS last_ip_address TEXT,
ADD COLUMN IF NOT EXISTS last_login_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS is_vpn_user BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS isp_organization TEXT;

-- Add index for IP lookups
CREATE INDEX IF NOT EXISTS idx_users_ip ON users(last_ip_address);
CREATE INDEX IF NOT EXISTS idx_users_vpn ON users(is_vpn_user) WHERE is_vpn_user = TRUE;

-- Add comments
COMMENT ON COLUMN users.last_ip_address IS 'Last known IP address of the user';
COMMENT ON COLUMN users.last_login_at IS 'Timestamp of last login';
COMMENT ON COLUMN users.is_vpn_user IS 'True if user has ever logged in via VPN/proxy';
COMMENT ON COLUMN users.isp_organization IS 'ISP organization from most recent login';
