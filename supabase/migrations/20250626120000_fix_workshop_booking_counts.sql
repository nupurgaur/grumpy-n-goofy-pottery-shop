-- Fix workshop booking counts for paid orders (legacy + normalized slot/date matching)

CREATE OR REPLACE FUNCTION public.normalize_workshop_slot(p_slot TEXT)
RETURNS TEXT
LANGUAGE SQL
IMMUTABLE
AS $$
  SELECT trim(
    replace(
      replace(
        replace(COALESCE(p_slot, ''), '–', '-'),
        '—', '-'
      ),
      '−', '-'
    )
  );
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
    ELSE NULL
  END;
$$;

CREATE OR REPLACE FUNCTION public.legacy_workshop_session_date(p_product_name TEXT)
RETURNS DATE
LANGUAGE plpgsql
IMMUTABLE
AS $$
DECLARE
  v_match TEXT[];
  v_date_text TEXT;
BEGIN
  IF p_product_name IS NULL OR p_product_name NOT LIKE 'Workshop —%' THEN
    RETURN NULL;
  END IF;

  v_match := regexp_match(p_product_name, '·\s*([A-Za-z]{3},\s*[A-Za-z]{3}\s+\d{1,2},\s*\d{4})\s*·');
  IF v_match IS NULL THEN
    RETURN NULL;
  END IF;

  v_date_text := trim(v_match[1]);

  BEGIN
    RETURN to_date(v_date_text, 'Dy, Mon DD, YYYY');
  EXCEPTION WHEN OTHERS THEN
    BEGIN
      RETURN to_date(v_date_text, 'Day, Mon DD, YYYY');
    EXCEPTION WHEN OTHERS THEN
      RETURN NULL;
    END;
  END;
END;
$$;

CREATE OR REPLACE FUNCTION public.legacy_workshop_session_slot(p_product_name TEXT)
RETURNS TEXT
LANGUAGE SQL
IMMUTABLE
AS $$
  SELECT CASE
    WHEN p_product_name IS NULL OR p_product_name NOT LIKE 'Workshop —%' THEN NULL
    ELSE trim((regexp_match(p_product_name, '·\s*[^·]+\s*·\s*(.+)$'))[1])
  END;
$$;

CREATE OR REPLACE FUNCTION public.workshop_order_item_seats(p_item public.order_items)
RETURNS INTEGER
LANGUAGE SQL
STABLE
AS $$
  SELECT CASE
    WHEN p_item.workshop_booking IS NOT NULL THEN
      GREATEST(
        jsonb_array_length(COALESCE(p_item.workshop_booking->'participants', '[]'::jsonb)),
        CASE
          WHEN COALESCE(p_item.workshop_booking->>'scheduleId', '') = 'date-night' THEN p_item.quantity * 2
          WHEN p_item.workshop_booking->>'scheduleId' IS NOT NULL THEN p_item.quantity
          ELSE 0
        END
      )
    WHEN public.legacy_workshop_schedule_id(p_item.product_id, p_item.product_name) = 'date-night' THEN p_item.quantity * 2
    WHEN public.legacy_workshop_schedule_id(p_item.product_id, p_item.product_name) IS NOT NULL THEN p_item.quantity
    ELSE 0
  END;
$$;

CREATE OR REPLACE FUNCTION public.workshop_order_item_matches_session(
  p_item public.order_items,
  p_schedule_id TEXT,
  p_session_date DATE,
  p_slot TEXT
)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
AS $$
  SELECT CASE
    WHEN p_item.workshop_booking IS NOT NULL
      AND p_item.workshop_booking->>'scheduleId' = p_schedule_id
      AND (p_item.workshop_booking->>'sessionDate')::date = p_session_date
      AND public.normalize_workshop_slot(p_item.workshop_booking->>'slot') = public.normalize_workshop_slot(p_slot)
      THEN TRUE
    WHEN p_item.product_name LIKE 'Workshop —%'
      AND public.legacy_workshop_schedule_id(p_item.product_id, p_item.product_name) = p_schedule_id
      AND public.legacy_workshop_session_date(p_item.product_name) = p_session_date
      AND public.normalize_workshop_slot(public.legacy_workshop_session_slot(p_item.product_name)) = public.normalize_workshop_slot(p_slot)
      THEN TRUE
    ELSE FALSE
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
  SELECT COALESCE(SUM(public.workshop_order_item_seats(oi)), 0)::INTEGER
  FROM public.order_items oi
  JOIN public.orders o ON o.id = oi.order_id
  WHERE o.payment_status = 'paid'
    AND public.workshop_order_item_matches_session(oi, p_schedule_id, p_session_date, p_slot);
$$;

-- Ensure sessions exist for all paid workshop bookings (including legacy orders)
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
        OR oi.product_id IN (9991, 9992, 9993, 9994)
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

GRANT EXECUTE ON FUNCTION public.sync_workshop_sessions_from_orders() TO authenticated;
GRANT EXECUTE ON FUNCTION public.normalize_workshop_slot(TEXT) TO authenticated, anon;

-- Backfill workshop_booking JSON on legacy paid workshop order items where possible
UPDATE public.order_items oi
SET workshop_booking = jsonb_build_object(
  'scheduleId', public.legacy_workshop_schedule_id(oi.product_id, oi.product_name),
  'sessionDate', to_char(public.legacy_workshop_session_date(oi.product_name), 'YYYY-MM-DD'),
  'slot', public.legacy_workshop_session_slot(oi.product_name),
  'participants', '[]'::jsonb
)
FROM public.orders o
WHERE o.id = oi.order_id
  AND o.payment_status = 'paid'
  AND oi.workshop_booking IS NULL
  AND oi.product_name LIKE 'Workshop —%'
  AND public.legacy_workshop_schedule_id(oi.product_id, oi.product_name) IS NOT NULL
  AND public.legacy_workshop_session_date(oi.product_name) IS NOT NULL
  AND public.legacy_workshop_session_slot(oi.product_name) IS NOT NULL;

SELECT public.sync_workshop_sessions_from_orders();
