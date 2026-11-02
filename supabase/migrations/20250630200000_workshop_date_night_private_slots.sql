-- Date night & private parties: same bookable slots as handbuilding (12–2, 3–5, 6–8 PM).

UPDATE public.workshop_experiences
SET
  time_slot = 'Wednesday–Sunday · 12–2 PM, 3–5 PM, 6–8 PM',
  updated_at = now()
WHERE id IN ('date-night', 'private-clay-parties');
