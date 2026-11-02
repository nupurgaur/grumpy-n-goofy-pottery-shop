-- Availability checks must not write; STABLE RPCs run in read-only transactions on Supabase.

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
  v_booked := public.count_workshop_session_bookings(p_schedule_id, p_session_date, p_slot);
  v_today := (timezone('Asia/Kolkata', now()))::date;
  v_open := p_session_date > v_today
    AND EXTRACT(DOW FROM p_session_date) NOT IN (1, 2);

  SELECT *
  INTO v_session
  FROM public.workshop_sessions
  WHERE schedule_id = p_schedule_id
    AND session_date = p_session_date
    AND slot = p_slot;

  IF NOT FOUND THEN
    v_capacity := public.default_workshop_capacity(p_schedule_id);
    IF p_schedule_id = 'date-night' THEN
      v_capacity := LEAST(v_capacity, 2);
    END IF;

    RETURN QUERY
    SELECT
      NULL::UUID,
      v_capacity,
      v_booked,
      CASE WHEN v_open THEN GREATEST(v_capacity - v_booked, 0) ELSE 0 END,
      v_open;
    RETURN;
  END IF;

  v_capacity := v_session.capacity;
  IF p_schedule_id = 'date-night' THEN
    v_capacity := LEAST(v_capacity, 2);
  END IF;

  v_open := v_session.is_active AND v_open;

  RETURN QUERY
  SELECT
    v_session.id,
    v_capacity,
    v_booked,
    CASE WHEN v_open THEN GREATEST(v_capacity - v_booked, 0) ELSE 0 END,
    v_open;
END;
$$;
