-- Made-to-order custom pot product + cart/order design metadata

INSERT INTO public.products (
  id,
  name,
  description,
  price,
  image_url,
  stock_quantity,
  low_stock_threshold,
  is_featured,
  is_active,
  category
)
VALUES (
  9999,
  'Design Your Own Pot',
  'Made-to-order custom ceramic mug, pin pot, or trinket jar.',
  1999.00,
  '/logo-icon.png',
  9999,
  0,
  false,
  true,
  'mugs'
)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  price = EXCLUDED.price,
  image_url = EXCLUDED.image_url,
  is_active = true;

SELECT setval(
  pg_get_serial_sequence('public.products', 'id'),
  GREATEST((SELECT COALESCE(MAX(id), 1) FROM public.products), 9999)
);

ALTER TABLE public.cart_items
  ADD COLUMN IF NOT EXISTS custom_design JSONB;

ALTER TABLE public.order_items
  ADD COLUMN IF NOT EXISTS custom_design JSONB;
