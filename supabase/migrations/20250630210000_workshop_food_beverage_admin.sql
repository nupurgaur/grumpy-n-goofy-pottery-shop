-- Structured food & beverage offer for date night and private clay parties.

UPDATE public.workshop_experiences
SET
  add_ons = jsonb_build_array(
    jsonb_build_object(
      'id', 'food-wine',
      'label', 'Food & Wine',
      'price', 3500,
      'checkoutEnabled', true,
      'pageNote', COALESCE(
        additional_note,
        'Optional wine & food on request — available at an extra charge.'
      )
    )
  ),
  additional_note = NULL,
  updated_at = now()
WHERE id = 'date-night';

UPDATE public.workshop_experiences
SET
  add_ons = jsonb_build_array(
    jsonb_build_object(
      'id', 'food-wine',
      'label', 'Food & Wine',
      'price', 3500,
      'checkoutEnabled', true,
      'pageNote', 'Optional food and beverages for your group — add at checkout.'
    )
  ),
  updated_at = now()
WHERE id = 'private-clay-parties';
