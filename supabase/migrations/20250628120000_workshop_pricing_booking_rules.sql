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
  price = 3500,
  price_label = '₹3500 per couple',
  add_ons = '["Food & Wine — ₹3,500"]'::jsonb,
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

-- One couple per date-night slot, and no same-day or Monday/Tuesday bookings.
CREATE OR REPLACE FUNCTION public.get_workshop_session_availability(
  p_schedule_id TEXT,
  p_session_date DATE,
  p_slot TEXT
)
RETURNS TABLE (
  session_id UUID,
  capacity INTEGER,
  booked INTEGER,
  remaining INTEGER,
  is_active BOOLEAN
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_session public.workshop_sessions;
  v_booked INTEGER;
  v_capacity INTEGER;
  v_today DATE;
  v_open BOOLEAN;
BEGIN
  v_session := public.ensure_workshop_session(p_schedule_id, p_session_date, p_slot);
  v_booked := public.count_workshop_session_bookings(p_schedule_id, p_session_date, p_slot);
  v_capacity := v_session.capacity;

  IF p_schedule_id = 'date-night' THEN
    v_capacity := LEAST(v_capacity, 2);
  END IF;

  v_today := (timezone('Asia/Kolkata', now()))::date;
  v_open := v_session.is_active
    AND p_session_date > v_today
    AND EXTRACT(DOW FROM p_session_date) NOT IN (1, 2);

  RETURN QUERY
  SELECT
    v_session.id,
    v_capacity,
    v_booked,
    CASE WHEN v_open THEN GREATEST(v_capacity - v_booked, 0) ELSE 0 END,
    v_open;
END;
$$;
