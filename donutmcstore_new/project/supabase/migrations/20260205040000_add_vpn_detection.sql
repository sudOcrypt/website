-- Add VPN/Proxy detection fields to login_logs
ALTER TABLE login_logs
ADD COLUMN IF NOT EXISTS is_vpn_suspected BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS isp_org TEXT;

-- Add index for querying VPN users
CREATE INDEX IF NOT EXISTS idx_login_logs_vpn ON login_logs(is_vpn_suspected) WHERE is_vpn_suspected = TRUE;

-- Add comment
COMMENT ON COLUMN login_logs.is_vpn_suspected IS 'Indicates if the IP is suspected to be a VPN/proxy';
COMMENT ON COLUMN login_logs.isp_org IS 'ISP organization name for the IP address';
