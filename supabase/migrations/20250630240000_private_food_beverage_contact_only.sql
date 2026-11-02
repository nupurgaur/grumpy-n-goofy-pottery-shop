UPDATE public.workshop_experiences
SET
  add_ons = '[]'::jsonb,
  updated_at = now()
WHERE id = 'date-night';

UPDATE public.workshop_experiences
SET
  add_ons = jsonb_build_array(
    jsonb_build_object(
      'id', 'food-beverage-contact',
      'enabled', true,
      'checkboxLabel', 'I''m interested in food & beverages — we''ll contact you separately to arrange.',
      'pageNote', 'Want food or drinks for your party? Tick the box when booking and we''ll reach out to plan it with you.'
    )
  ),
  updated_at = now()
WHERE id = 'private-clay-parties';
