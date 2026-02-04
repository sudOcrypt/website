/*
  # Storage Bucket Setup

  ## Overview
  Creates storage bucket for schematics files.

  ## Buckets
  - `schematics` - For storing schematic files and preview images
*/

INSERT INTO storage.buckets (id, name, public)
VALUES ('schematics', 'schematics', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Authenticated users can upload schematics"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'schematics');

CREATE POLICY "Anyone can view schematics"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'schematics');

CREATE POLICY "Users can delete own schematics"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'schematics' AND auth.uid()::text = (storage.foldername(name))[1]);