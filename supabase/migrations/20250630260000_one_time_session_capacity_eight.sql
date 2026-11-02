-- One-time workshops share 8 seats per studio time slot (not 10/12 per experience type).

UPDATE public.workshop_sessions
SET capacity = 8, updated_at = now()
WHERE schedule_id IN (
  'paint-your-own-pot',
  'handbuilding-ceramics',
  'wheel-throwing'
)
AND capacity <> 8;

CREATE OR REPLACE FUNCTION public.default_workshop_capacity(p_schedule_id TEXT)
RETURNS INTEGER
LANGUAGE SQL
IMMUTABLE
AS $$
  SELECT CASE p_schedule_id
    WHEN 'paint-your-own-pot' THEN 8
    WHEN 'handbuilding-ceramics' THEN 8
    WHEN 'wheel-throwing' THEN 8
    WHEN 'date-night' THEN 2
    WHEN 'private-clay-parties' THEN 10
    ELSE 8
  END;
$$;
