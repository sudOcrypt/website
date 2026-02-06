CREATE TABLE IF NOT EXISTS banners (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  message TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  start_date TIMESTAMPTZ,
  end_date TIMESTAMPTZ,
  display_order INTEGER DEFAULT 0,
  background_color TEXT DEFAULT 'from-cyan-500 to-blue-600',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_banners_active ON banners(is_active, display_order);

ALTER TABLE banners ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active banners"
  ON banners FOR SELECT
  USING (
    is_active = true 
    AND (start_date IS NULL OR start_date <= now())
    AND (end_date IS NULL OR end_date > now())
  );

CREATE POLICY "Admins can manage banners"
  ON banners FOR ALL
  USING (EXISTS (
    SELECT 1 FROM users WHERE users.id = auth.uid() AND users.is_admin = true
  ));

INSERT INTO banners (message, is_active, end_date, display_order, background_color) VALUES
  ('🎉 Use code DONUT for 10% OFF site-wide! Ends Saturday midnight!', true, '2026-02-09 04:59:59+00', 1, 'from-yellow-500 to-orange-600'),
  ('💰 FREE 1 MILLION COINS with every purchase this weekend only!', true, '2026-02-09 04:59:59+00', 2, 'from-green-500 to-emerald-600');
