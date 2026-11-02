-- Workshop pricing, food & wine add-on copy, and date-night capacity of one couple

UPDATE public.workshop_experiences
SET
  price = 1699,
  price_label = '₹1699 per person',
  additional_note = 'Firing and glazing available at ₹300 per finished piece.',
  updated_at = now()
WHERE id = 'handbuilding-ceramics';

UPDATE public.workshop_experiences
SET
  title = 'Pottery date for couples',
  price = 3500,
  price_label = '₹3500 per couple',
  add_ons = '[]'::jsonb,
  additional_note = 'Optional wine & food on request — available at an extra charge.',
  updated_at = now()
WHERE id = 'date-night';

UPDATE public.workshop_tabs
SET
  label = 'Pottery Date for Couples',
  updated_at = now()
WHERE id = 'date-night';

UPDATE public.workshop_experiences
SET
  price = 1599,
  price_label = '₹1599 per person',
  add_ons = '["Food & Wine — ₹3,500"]'::jsonb,
  updated_at = now()
WHERE id = 'private-clay-parties';

UPDATE public.products
SET price = 1699.00, updated_at = now()
WHERE id = 9992;

UPDATE public.products
SET price = 3500.00, updated_at = now()
WHERE id = 9994;

UPDATE public.products
SET price = 1599.00, updated_at = now()
WHERE id = 9995;

CREATE OR REPLACE FUNCTION public.default_workshop_capacity(p_schedule_id TEXT)
RETURNS INTEGER
LANGUAGE SQL
IMMUTABLE
AS $$
  SELECT CASE p_schedule_id
    WHEN 'paint-your-own-pot' THEN 10
    WHEN 'handbuilding-ceramics' THEN 12
    WHEN 'wheel-throwing' THEN 8
    WHEN 'date-night' THEN 2
    WHEN 'private-clay-parties' THEN 10
    ELSE 12
  END;
$$;

UPDATE public.workshop_sessions
SET capacity = 2, updated_at = now()
WHERE schedule_id = 'date-night'
  AND session_date >= CURRENT_DATE
  AND capacity > 2;

-- See 20250629120000_workshop_availability_readonly_fix.sql for get_workshop_session_availability.

UPDATE public.workshop_experiences
SET is_visible = false, updated_at = now()
WHERE id IN ('paint-your-own-pot', 'wheel-throwing');
