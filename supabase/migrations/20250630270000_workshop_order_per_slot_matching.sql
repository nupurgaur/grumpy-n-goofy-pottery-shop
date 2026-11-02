-- Each order line is matched by schedule + session date + time slot (not product_id alone).
-- Use workshop_booking JSON when present, otherwise parse the Workshop — … line title.

CREATE OR REPLACE FUNCTION public.workshop_order_item_schedule_id(p_item public.order_items)
RETURNS TEXT
LANGUAGE SQL
IMMUTABLE
AS $$
  SELECT COALESCE(
    p_item.workshop_booking->>'scheduleId',
    public.legacy_workshop_schedule_id(p_item.product_id, p_item.product_name)
  );
$$;

CREATE OR REPLACE FUNCTION public.workshop_order_item_session_date(p_item public.order_items)
RETURNS DATE
LANGUAGE SQL
IMMUTABLE
AS $$
  SELECT COALESCE(
    (p_item.workshop_booking->>'sessionDate')::date,
    public.legacy_workshop_session_date(p_item.product_name)
  );
$$;

CREATE OR REPLACE FUNCTION public.workshop_order_item_session_slot(p_item public.order_items)
RETURNS TEXT
LANGUAGE SQL
IMMUTABLE
AS $$
  SELECT COALESCE(
    p_item.workshop_booking->>'slot',
    public.legacy_workshop_session_slot(p_item.product_name)
  );
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
  SELECT
    public.workshop_order_item_schedule_id(p_item) = p_schedule_id
    AND public.workshop_order_item_session_date(p_item) = p_session_date
    AND public.normalize_workshop_slot(public.workshop_order_item_session_slot(p_item))
      = public.normalize_workshop_slot(p_slot);
$$;

-- Backfill structured booking metadata on paid workshop lines (one row per date/slot/experience).
UPDATE public.order_items oi
SET workshop_booking = jsonb_strip_nulls(
  COALESCE(oi.workshop_booking, '{}'::jsonb)
  || jsonb_build_object(
    'scheduleId', public.workshop_order_item_schedule_id(oi),
    'sessionDate', to_char(public.workshop_order_item_session_date(oi), 'YYYY-MM-DD'),
    'slot', public.workshop_order_item_session_slot(oi)
  )
)
FROM public.orders o
WHERE o.id = oi.order_id
  AND o.payment_status = 'paid'
  AND oi.product_name LIKE 'Workshop —%'
  AND public.workshop_order_item_schedule_id(oi) IS NOT NULL
  AND public.workshop_order_item_session_date(oi) IS NOT NULL
  AND public.workshop_order_item_session_slot(oi) IS NOT NULL
  AND (
    oi.workshop_booking IS NULL
    OR oi.workshop_booking->>'scheduleId' IS NULL
    OR oi.workshop_booking->>'sessionDate' IS NULL
    OR oi.workshop_booking->>'slot' IS NULL
  );

SELECT public.sync_workshop_sessions_from_orders();
