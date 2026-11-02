-- Mark internal workshop placeholder products so they stay out of the shop catalog
ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS is_workshop BOOLEAN NOT NULL DEFAULT false;

UPDATE public.products
SET is_workshop = true
WHERE id IN (9991, 9992, 9993, 9994)
   OR name ILIKE 'Workshop —%';
