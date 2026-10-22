-- Placeholder products for workshop bookings (order_items FK requires valid product_id)
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
VALUES
  (
    9991,
    'Workshop — Paint Your Own Pot',
    'In-studio paint-your-own-pot workshop booking.',
    1000.00,
    '/workshops/paint-your-own-pot.png',
    9999,
    0,
    false,
    true,
    'general'
  ),
  (
    9992,
    'Workshop — Handbuilding Ceramics',
    'In-studio handbuilding ceramics workshop booking.',
    1800.00,
    '/workshops/handbuilding.png',
    9999,
    0,
    false,
    true,
    'general'
  ),
  (
    9993,
    'Workshop — Wheel Throwing',
    'In-studio wheel throwing workshop booking.',
    1500.00,
    '/workshops/wheel-throwing.png',
    9999,
    0,
    false,
    true,
    'general'
  ),
  (
    9994,
    'Workshop — Clay Date Night',
    'In-studio clay date night workshop booking.',
    3200.00,
    '/workshops/date-night.png',
    9999,
    0,
    false,
    true,
    'general'
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
