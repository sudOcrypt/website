/*
  # Create Storage Bucket for Schematics

  ## Overview
  Creates a storage bucket for storing schematic files and preview images.

  ## Changes
  1. Create 'schematics' storage bucket
  2. Set up RLS policies for the bucket
  
  ## Security
  - Authenticated users can upload to their own folder
  - Public read access for approved schematics
  - Admins can read all files
*/

INSERT INTO storage.buckets (id, name, public)
VALUES ('schematics', 'schematics', false)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Authenticated users can upload their schematics"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'schematics' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Users can read their own schematics"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'schematics' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Admins can read all schematics"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'schematics' AND
  EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND is_admin = true)
);

CREATE POLICY "Public can read approved schematic previews"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'schematics' AND
  EXISTS (
    SELECT 1 FROM public.schematics 
    WHERE (file_path = name OR preview_image_path = name) 
    AND status = 'approved'
  )
);

CREATE POLICY "Users can delete their own pending schematics"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'schematics' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Admins can delete any schematic file"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'schematics' AND
  EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND is_admin = true)
);