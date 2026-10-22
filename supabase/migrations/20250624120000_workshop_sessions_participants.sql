-- Workshop sessions (capacity per date/slot) and participant metadata on cart/order lines

CREATE TABLE IF NOT EXISTS public.workshop_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  schedule_id TEXT NOT NULL,
  session_date DATE NOT NULL,
  slot TEXT NOT NULL,
  capacity INTEGER NOT NULL DEFAULT 12 CHECK (capacity > 0),
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (schedule_id, session_date, slot)
);

ALTER TABLE public.workshop_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Workshop sessions are viewable by everyone"
  ON public.workshop_sessions FOR SELECT USING (true);

CREATE POLICY "Admins can manage workshop sessions"
  ON public.workshop_sessions FOR ALL
  USING (public.has_role(auth.uid(), 'admin'::app_role));

ALTER TABLE public.cart_items
  ADD COLUMN IF NOT EXISTS workshop_booking JSONB;

ALTER TABLE public.order_items
  ADD COLUMN IF NOT EXISTS workshop_booking JSONB;

CREATE INDEX IF NOT EXISTS idx_workshop_sessions_lookup
  ON public.workshop_sessions (schedule_id, session_date, slot);

CREATE INDEX IF NOT EXISTS idx_order_items_workshop_booking
  ON public.order_items USING gin (workshop_booking);

-- Default capacity by workshop type
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
    ELSE 12
  END;
$$;

CREATE OR REPLACE FUNCTION public.ensure_workshop_session(
  p_schedule_id TEXT,
  p_session_date DATE,
  p_slot TEXT
)
RETURNS public.workshop_sessions
LANGUAGE plpgsql
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

CREATE OR REPLACE FUNCTION public.count_workshop_session_bookings(
  p_schedule_id TEXT,
  p_session_date DATE,
  p_slot TEXT
)
RETURNS INTEGER
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(SUM(jsonb_array_length(COALESCE(oi.workshop_booking->'participants', '[]'::jsonb))), 0)::INTEGER
  FROM public.order_items oi
  JOIN public.orders o ON o.id = oi.order_id
  WHERE o.payment_status = 'paid'
    AND oi.workshop_booking IS NOT NULL
    AND oi.workshop_booking->>'scheduleId' = p_schedule_id
    AND oi.workshop_booking->>'sessionDate' = p_session_date::TEXT
    AND oi.workshop_booking->>'slot' = p_slot;
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
BEGIN
  v_session := public.ensure_workshop_session(p_schedule_id, p_session_date, p_slot);
  v_booked := public.count_workshop_session_bookings(p_schedule_id, p_session_date, p_slot);

  RETURN QUERY
  SELECT
    v_session.id,
    v_session.capacity,
    v_booked,
    GREATEST(v_session.capacity - v_booked, 0),
    v_session.is_active;
END;
$$;

GRANT EXECUTE ON FUNCTION public.ensure_workshop_session(TEXT, DATE, TEXT) TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.get_workshop_session_availability(TEXT, DATE, TEXT) TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.count_workshop_session_bookings(TEXT, DATE, TEXT) TO authenticated, anon;
