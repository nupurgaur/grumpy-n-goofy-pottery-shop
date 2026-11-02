ALTER TABLE public.products DROP CONSTRAINT IF EXISTS check_valid_category;

ALTER TABLE public.products
  ADD CONSTRAINT check_valid_category
  CHECK (category IN (
    'mugs', 'bowls', 'plates', 'ceramic-clocks', 'lamps',
    'spoon-rests', 'vases', 'kitchen-towel-holders', 'tea-light-holders',
    'templates', 'general'
  ));
