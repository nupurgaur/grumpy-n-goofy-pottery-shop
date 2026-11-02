-- Fix: get_workshop_session_availability must not INSERT (STABLE = read-only on Supabase).
-- Re-apply safe definition if an older migration left ensure_workshop_session inside it.

CREATE OR REPLACE FUNCTION public.ensure_workshop_session(
  p_schedule_id TEXT,
  p_session_date DATE,
  p_slot TEXT
)
RETURNS public.workshop_sessions
LANGUAGE plpgsql
VOLATILE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_session public.workshop_sessions;
BEGIN
  INSERT INTO public.workshop_sessions (schedule_id, session_date, slot, capacity)
  VALUES (
    p_schedule_id,
    p_session_date,
    p_slot,
    public.default_workshop_capacity(p_schedule_id)
  )
  ON CONFLICT (schedule_id, session_date, slot)
  DO UPDATE SET updated_at = now()
  RETURNING * INTO v_session;

  RETURN v_session;
END;
$$;

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
  v_open := (p_session_date - v_today) >= 1
    AND EXTRACT(DOW FROM p_session_date) NOT IN (1, 2);

  SELECT *
  INTO v_session
  FROM public.workshop_sessions
  WHERE schedule_id = p_schedule_id
    AND session_date = p_session_date
    AND public.normalize_workshop_slot(slot) = public.normalize_workshop_slot(p_slot);

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

GRANT EXECUTE ON FUNCTION public.ensure_workshop_session(TEXT, DATE, TEXT) TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.get_workshop_session_availability(TEXT, DATE, TEXT) TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.count_workshop_session_bookings(TEXT, DATE, TEXT) TO authenticated, anon;
