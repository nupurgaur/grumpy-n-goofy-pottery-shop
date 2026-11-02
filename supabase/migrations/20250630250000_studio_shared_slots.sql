-- Shared studio slot capacity (8 seats per date/slot for one-time experiences)
-- Cross-type rules: exclusive bookings block the slot; any one-time seat blocks date night & private parties.

CREATE TABLE IF NOT EXISTS public.studio_slot_overrides (
  session_date DATE NOT NULL,
  slot TEXT NOT NULL,
  is_blocked BOOLEAN NOT NULL DEFAULT false,
  notes TEXT,
  google_calendar_event_id TEXT,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (session_date, slot)
);

CREATE TABLE IF NOT EXISTS public.workshop_offline_bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_date DATE NOT NULL,
  slot TEXT NOT NULL,
  schedule_id TEXT NOT NULL,
  seats INTEGER NOT NULL DEFAULT 1 CHECK (seats > 0),
  customer_name TEXT,
  phone TEXT,
  notes TEXT,
  google_calendar_event_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_workshop_offline_bookings_lookup
  ON public.workshop_offline_bookings (session_date, slot);

ALTER TABLE public.studio_slot_overrides ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workshop_offline_bookings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Studio slot overrides viewable by everyone"
  ON public.studio_slot_overrides FOR SELECT USING (true);

CREATE POLICY "Admins manage studio slot overrides"
  ON public.studio_slot_overrides FOR ALL
  USING (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Workshop offline bookings viewable by admins"
  ON public.workshop_offline_bookings FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins manage workshop offline bookings"
  ON public.workshop_offline_bookings FOR ALL
  USING (public.has_role(auth.uid(), 'admin'::app_role));

CREATE OR REPLACE FUNCTION public.is_one_time_workshop_schedule(p_schedule_id TEXT)
RETURNS BOOLEAN
LANGUAGE SQL
IMMUTABLE
AS $$
  SELECT p_schedule_id IN (
    'paint-your-own-pot',
    'handbuilding-ceramics',
    'wheel-throwing'
  );
$$;

CREATE OR REPLACE FUNCTION public.is_exclusive_workshop_schedule(p_schedule_id TEXT)
RETURNS BOOLEAN
LANGUAGE SQL
IMMUTABLE
AS $$
  SELECT p_schedule_id IN ('date-night', 'private-clay-parties');
$$;

CREATE OR REPLACE FUNCTION public.studio_one_time_slot_capacity()
RETURNS INTEGER
LANGUAGE SQL
IMMUTABLE
AS $$
  SELECT 8;
$$;

CREATE OR REPLACE FUNCTION public.default_workshop_capacity(p_schedule_id TEXT)
RETURNS INTEGER
LANGUAGE SQL
IMMUTABLE
AS $$
  SELECT CASE
    WHEN public.is_one_time_workshop_schedule(p_schedule_id) THEN public.studio_one_time_slot_capacity()
    WHEN p_schedule_id = 'date-night' THEN 2
    WHEN p_schedule_id = 'private-clay-parties' THEN 10
    ELSE 12
  END;
$$;

CREATE OR REPLACE FUNCTION public.studio_slot_is_admin_blocked(p_session_date DATE, p_slot TEXT)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(
    (
      SELECT o.is_blocked
      FROM public.studio_slot_overrides o
      WHERE o.session_date = p_session_date
        AND public.normalize_workshop_slot(o.slot) = public.normalize_workshop_slot(p_slot)
    ),
    false
  );
$$;

CREATE OR REPLACE FUNCTION public.count_studio_one_time_seats(p_session_date DATE, p_slot TEXT)
RETURNS INTEGER
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    COALESCE(
      (
        SELECT SUM(public.workshop_order_item_seats(oi))::INTEGER
        FROM public.order_items oi
        JOIN public.orders o ON o.id = oi.order_id
        WHERE o.payment_status = 'paid'
          AND public.is_one_time_workshop_schedule(
            COALESCE(
              oi.workshop_booking->>'scheduleId',
              public.legacy_workshop_schedule_id(oi.product_id, oi.product_name)
            )
          )
          AND COALESCE(
            (oi.workshop_booking->>'sessionDate')::date,
            public.legacy_workshop_session_date(oi.product_name)
          ) = p_session_date
          AND public.normalize_workshop_slot(
            COALESCE(
              oi.workshop_booking->>'slot',
              public.legacy_workshop_session_slot(oi.product_name)
            )
          ) = public.normalize_workshop_slot(p_slot)
      ),
      0
    )
    + COALESCE(
      (
        SELECT SUM(b.seats)::INTEGER
        FROM public.workshop_offline_bookings b
        WHERE b.session_date = p_session_date
          AND public.normalize_workshop_slot(b.slot) = public.normalize_workshop_slot(p_slot)
          AND public.is_one_time_workshop_schedule(b.schedule_id)
      ),
      0
    );
$$;

CREATE OR REPLACE FUNCTION public.studio_slot_has_exclusive_booking(p_session_date DATE, p_slot TEXT)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.order_items oi
    JOIN public.orders o ON o.id = oi.order_id
    WHERE o.payment_status = 'paid'
      AND public.is_exclusive_workshop_schedule(
        COALESCE(
          oi.workshop_booking->>'scheduleId',
          public.legacy_workshop_schedule_id(oi.product_id, oi.product_name)
        )
      )
      AND COALESCE(
        (oi.workshop_booking->>'sessionDate')::date,
        public.legacy_workshop_session_date(oi.product_name)
      ) = p_session_date
      AND public.normalize_workshop_slot(
        COALESCE(
          oi.workshop_booking->>'slot',
          public.legacy_workshop_session_slot(oi.product_name)
        )
      ) = public.normalize_workshop_slot(p_slot)
  )
  OR EXISTS (
    SELECT 1
    FROM public.workshop_offline_bookings b
    WHERE b.session_date = p_session_date
      AND public.normalize_workshop_slot(b.slot) = public.normalize_workshop_slot(p_slot)
      AND public.is_exclusive_workshop_schedule(b.schedule_id)
  );
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
        WHEN v_open AND v_booked <= 0 THEN 1
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

CREATE OR REPLACE FUNCTION public.get_studio_slot_calendar_range(
  p_from DATE,
  p_to DATE
)
RETURNS TABLE (
  session_date DATE,
  slot TEXT,
  one_time_used INTEGER,
  one_time_capacity INTEGER,
  has_exclusive_booking BOOLEAN,
  is_blocked BOOLEAN,
  exclusive_label TEXT,
  notes TEXT
)
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  WITH days AS (
    SELECT d::date AS session_date
    FROM generate_series(p_from, p_to, '1 day'::interval) AS d
    WHERE EXTRACT(DOW FROM d::date) NOT IN (1, 2)
  ),
  slots AS (
    SELECT unnest(ARRAY[
      '12:00 PM – 2:00 PM',
      '3:00 PM – 5:00 PM',
      '6:00 PM – 8:00 PM'
    ]::text[]) AS slot
  ),
  grid AS (
    SELECT days.session_date, slots.slot
    FROM days
    CROSS JOIN slots
  )
  SELECT
    g.session_date,
    g.slot,
    public.count_studio_one_time_seats(g.session_date, g.slot) AS one_time_used,
    public.studio_one_time_slot_capacity() AS one_time_capacity,
    public.studio_slot_has_exclusive_booking(g.session_date, g.slot) AS has_exclusive_booking,
    public.studio_slot_is_admin_blocked(g.session_date, g.slot) AS is_blocked,
    COALESCE(
      (
        SELECT CASE b.schedule_id
          WHEN 'date-night' THEN 'Date night'
          WHEN 'private-clay-parties' THEN 'Private party'
          ELSE b.schedule_id
        END
        FROM public.workshop_offline_bookings b
        WHERE b.session_date = g.session_date
          AND public.normalize_workshop_slot(b.slot) = public.normalize_workshop_slot(g.slot)
          AND public.is_exclusive_workshop_schedule(b.schedule_id)
        LIMIT 1
      ),
      (
        SELECT CASE COALESCE(
          oi.workshop_booking->>'scheduleId',
          public.legacy_workshop_schedule_id(oi.product_id, oi.product_name)
        )
          WHEN 'date-night' THEN 'Date night (order)'
          WHEN 'private-clay-parties' THEN 'Private party (order)'
          ELSE 'Exclusive (order)'
        END
        FROM public.order_items oi
        JOIN public.orders o ON o.id = oi.order_id
        WHERE o.payment_status = 'paid'
          AND public.is_exclusive_workshop_schedule(
            COALESCE(
              oi.workshop_booking->>'scheduleId',
              public.legacy_workshop_schedule_id(oi.product_id, oi.product_name)
            )
          )
          AND COALESCE(
            (oi.workshop_booking->>'sessionDate')::date,
            public.legacy_workshop_session_date(oi.product_name)
          ) = g.session_date
          AND public.normalize_workshop_slot(
            COALESCE(
              oi.workshop_booking->>'slot',
              public.legacy_workshop_session_slot(oi.product_name)
            )
          ) = public.normalize_workshop_slot(g.slot)
        LIMIT 1
      )
    ) AS exclusive_label,
    (
      SELECT o.notes
      FROM public.studio_slot_overrides o
      WHERE o.session_date = g.session_date
        AND public.normalize_workshop_slot(o.slot) = public.normalize_workshop_slot(g.slot)
    ) AS notes
  FROM grid g
  ORDER BY g.session_date, g.slot;
$$;

GRANT EXECUTE ON FUNCTION public.get_studio_slot_calendar_range(DATE, DATE) TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.count_studio_one_time_seats(DATE, TEXT) TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.studio_slot_has_exclusive_booking(DATE, TEXT) TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.studio_slot_is_admin_blocked(DATE, TEXT) TO authenticated, anon;
