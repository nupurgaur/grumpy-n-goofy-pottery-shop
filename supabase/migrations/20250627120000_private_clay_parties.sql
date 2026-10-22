-- Private clay parties + hide paused one-time experiences

INSERT INTO public.workshop_tabs (id, label, tagline, is_visible, sort_order) VALUES
  (
    'private-parties',
    'Private Clay Parties',
    'Kitty parties, birthdays, bridal showers — a private studio session for your group.',
    true,
    3
  )
ON CONFLICT (id) DO UPDATE SET
  label = EXCLUDED.label,
  tagline = EXCLUDED.tagline,
  is_visible = true,
  sort_order = EXCLUDED.sort_order;

UPDATE public.workshop_tabs
SET sort_order = 4, updated_at = now()
WHERE id = 'courses';

INSERT INTO public.workshop_experiences (
  id, tab_id, title, tagline, description, duration, price, price_label,
  additional_note, image_url, includes, sort_order, is_visible
) VALUES (
  'private-clay-parties',
  'private-parties',
  'Private Clay Parties',
  'Celebrate with clay — a private studio session for kitty parties, birthdays, and bridal showers.',
  'Book the studio for your group of 5 to 10 people. Perfect for kitty parties, birthday gatherings, bridal showers, and other celebrations where you want a hands-on, private clay experience together.',
  '2 Hours',
  1800,
  '₹1800 per person',
  'Private group booking for more than 4 guests, up to 10 people. Same studio hours as our other experiences: Wednesday–Sunday, 12–2 PM, 3–5 PM, and 6–8 PM.',
  '/workshops/handbuilding.png',
  '["Private studio session for your group","Guided handbuilding experience","Studio materials"]'::jsonb,
  1,
  true
)
ON CONFLICT (id) DO UPDATE SET
  tab_id = EXCLUDED.tab_id,
  title = EXCLUDED.title,
  tagline = EXCLUDED.tagline,
  description = EXCLUDED.description,
  duration = EXCLUDED.duration,
  price = EXCLUDED.price,
  price_label = EXCLUDED.price_label,
  additional_note = EXCLUDED.additional_note,
  image_url = EXCLUDED.image_url,
  includes = EXCLUDED.includes,
  is_visible = true;

UPDATE public.workshop_experiences
SET is_visible = false, updated_at = now()
WHERE id IN ('paint-your-own-pot', 'wheel-throwing');

UPDATE public.workshop_experiences
SET time_slot = 'Wednesday–Sunday · 12–2 PM, 3–5 PM, 6–8 PM', updated_at = now()
WHERE id = 'date-night';

INSERT INTO public.products (
  id, name, description, price, image_url, stock_quantity, low_stock_threshold,
  is_featured, is_active, category, is_workshop
)
VALUES (
  9995,
  'Workshop — Private Clay Parties',
  'In-studio private clay party booking for groups of 5 to 10 people.',
  1800.00,
  '/workshops/handbuilding.png',
  9999,
  0,
  false,
  true,
  'general',
  true
)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  price = EXCLUDED.price,
  image_url = EXCLUDED.image_url,
  is_active = true,
  is_workshop = true;

SELECT setval(
  pg_get_serial_sequence('public.products', 'id'),
  GREATEST((SELECT COALESCE(MAX(id), 1) FROM public.products), 9999)
);

CREATE OR REPLACE FUNCTION public.default_workshop_capacity(p_schedule_id TEXT)
RETURNS INTEGER
LANGUAGE SQL
IMMUTABLE
AS $$
  SELECT CASE p_schedule_id
    WHEN 'paint-your-own-pot' THEN 10
    WHEN 'handbuilding-ceramics' THEN 12
    WHEN 'wheel-throwing' THEN 8
    WHEN 'date-night' THEN 8
    WHEN 'private-clay-parties' THEN 10
    ELSE 12
  END;
$$;

CREATE OR REPLACE FUNCTION public.legacy_workshop_schedule_id(
  p_product_id INTEGER,
  p_product_name TEXT
)
RETURNS TEXT
LANGUAGE SQL
IMMUTABLE
AS $$
  SELECT CASE
    WHEN p_product_id = 9991 OR p_product_name ILIKE '%Paint Your Own Pot%' THEN 'paint-your-own-pot'
    WHEN p_product_id = 9992 OR p_product_name ILIKE '%Handbuilding%' THEN 'handbuilding-ceramics'
    WHEN p_product_id = 9993 OR p_product_name ILIKE '%Wheel Throwing%' THEN 'wheel-throwing'
    WHEN p_product_id = 9994 OR p_product_name ILIKE '%Date Night%' OR p_product_name ILIKE '%Clay Date%' THEN 'date-night'
    WHEN p_product_id = 9995 OR p_product_name ILIKE '%Private Clay%' THEN 'private-clay-parties'
    ELSE NULL
  END;
$$;

CREATE OR REPLACE FUNCTION public.sync_workshop_sessions_from_orders()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_row RECORD;
BEGIN
  FOR v_row IN
    SELECT DISTINCT
      COALESCE(oi.workshop_booking->>'scheduleId', public.legacy_workshop_schedule_id(oi.product_id, oi.product_name)) AS schedule_id,
      COALESCE((oi.workshop_booking->>'sessionDate')::date, public.legacy_workshop_session_date(oi.product_name)) AS session_date,
      COALESCE(oi.workshop_booking->>'slot', public.legacy_workshop_session_slot(oi.product_name)) AS slot
    FROM public.order_items oi
    JOIN public.orders o ON o.id = oi.order_id
    WHERE o.payment_status = 'paid'
      AND (
        oi.workshop_booking IS NOT NULL
        OR oi.product_name LIKE 'Workshop —%'
        OR oi.product_id IN (9991, 9992, 9993, 9994, 9995)
      )
  LOOP
    IF v_row.schedule_id IS NULL OR v_row.session_date IS NULL OR v_row.slot IS NULL THEN
      CONTINUE;
    END IF;

    PERFORM public.ensure_workshop_session(
      v_row.schedule_id,
      v_row.session_date,
      v_row.slot
    );
  END LOOP;

  RETURN 0;
END;
$$;
