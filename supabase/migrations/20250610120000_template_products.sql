-- Template products: digital PDF downloads with unlimited stock
ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS is_template BOOLEAN NOT NULL DEFAULT false;

ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS template_pdf_url TEXT;

ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS dimensions TEXT;

ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS weight TEXT;

ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS care TEXT DEFAULT 'Microwave safe';

ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS origin TEXT DEFAULT 'Handcrafted in India';

ALTER TABLE public.products DROP CONSTRAINT IF EXISTS check_valid_category;

ALTER TABLE public.products
  ADD CONSTRAINT check_valid_category
  CHECK (category IN (
    'mugs', 'bowls', 'plates', 'ceramic-clocks', 'lamps',
    'spoon-rests', 'vases', 'templates', 'general'
  ));

INSERT INTO storage.buckets (id, name, public)
VALUES ('template-pdfs', 'template-pdfs', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Template PDFs are publicly accessible"
ON storage.objects FOR SELECT
USING (bucket_id = 'template-pdfs');

CREATE POLICY "Admins can upload template PDFs"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'template-pdfs' AND has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete template PDFs"
ON storage.objects FOR DELETE
USING (bucket_id = 'template-pdfs' AND has_role(auth.uid(), 'admin'::app_role));
