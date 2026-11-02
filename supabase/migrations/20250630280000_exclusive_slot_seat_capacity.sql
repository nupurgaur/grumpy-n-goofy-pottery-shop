-- Exclusive workshops (date night, private party): remaining = guest seats when slot is open, not "1 party".

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
  v_one_time_used INTEGER;
  v_exclusive BOOLEAN;
  v_blocked BOOLEAN;
BEGIN
  v_today := (timezone('Asia/Kolkata', now()))::date;
  v_open := (p_session_date - v_today) >= 1
    AND EXTRACT(DOW FROM p_session_date) NOT IN (1, 2);

  v_blocked := public.studio_slot_is_admin_blocked(p_session_date, p_slot);
  v_exclusive := public.studio_slot_has_exclusive_booking(p_session_date, p_slot);
  v_one_time_used := public.count_studio_one_time_seats(p_session_date, p_slot);

  v_booked := public.count_workshop_session_bookings(p_schedule_id, p_session_date, p_slot);

  SELECT *
  INTO v_session
  FROM public.workshop_sessions
  WHERE schedule_id = p_schedule_id
    AND session_date = p_session_date
    AND public.normalize_workshop_slot(slot) = public.normalize_workshop_slot(p_slot);

  IF NOT FOUND THEN
    v_capacity := public.default_workshop_capacity(p_schedule_id);
  ELSE
    v_capacity := v_session.capacity;
    v_open := v_session.is_active AND v_open;
  END IF;

  IF p_schedule_id = 'date-night' THEN
    v_capacity := LEAST(v_capacity, 2);
  END IF;

  IF v_blocked OR v_exclusive THEN
    RETURN QUERY
    SELECT
      v_session.id,
      v_capacity,
      v_booked,
      0,
      false;
    RETURN;
  END IF;

  IF public.is_exclusive_workshop_schedule(p_schedule_id) THEN
    IF v_one_time_used >= 1 THEN
      RETURN QUERY
      SELECT v_session.id, v_capacity, v_booked, 0, v_open;
      RETURN;
    END IF;

    RETURN QUERY
    SELECT
      v_session.id,
      v_capacity,
      v_booked,
      CASE
        WHEN v_open AND v_booked <= 0 THEN v_capacity
        ELSE 0
      END,
      v_open;
    RETURN;
  END IF;

  IF public.is_one_time_workshop_schedule(p_schedule_id) THEN
    v_capacity := public.studio_one_time_slot_capacity();
    RETURN QUERY
    SELECT
      v_session.id,
      v_capacity,
      v_booked,
      CASE
        WHEN v_open THEN GREATEST(v_capacity - v_one_time_used, 0)
        ELSE 0
      END,
      v_open;
    RETURN;
  END IF;

  RETURN QUERY
  SELECT
    v_session.id,
    v_capacity,
    v_booked,
    CASE WHEN v_open THEN GREATEST(v_capacity - v_booked, 0) ELSE 0 END,
    v_open;
END;
$$;
