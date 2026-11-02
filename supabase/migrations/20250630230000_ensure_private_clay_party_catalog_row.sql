-- Ensure private clay parties tab + experience rows exist (admin upsert target).

INSERT INTO public.workshop_tabs (id, label, tagline, is_visible, sort_order) VALUES
  (
    'private-parties',
    'Private Clay Parties',
    'Kitty parties, birthdays, bridal showers — a private studio session for your group.',
    true,
    3
  )
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.workshop_experiences (
  id,
  tab_id,
  title,
  tagline,
  description,
  duration,
  price,
  price_label,
  additional_note,
  image_url,
  time_slot,
  includes,
  add_ons,
  sort_order,
  is_visible
) VALUES (
  'private-clay-parties',
  'private-parties',
  'Private Clay Parties',
  'Celebrate with clay — a private studio session for kitty parties, birthdays, and bridal showers.',
  'Book the studio for your group of 5 to 10 people. Perfect for kitty parties, birthday gatherings, bridal showers, and other celebrations where you want a hands-on, private clay experience together.',
  '2 Hours',
  1599,
  '₹1599 per person',
  'Private group booking for more than 4 guests, up to 10 people. Same studio hours as our other experiences: Wednesday–Sunday, 12–2 PM, 3–5 PM, and 6–8 PM.',
  '/workshops/handbuilding.png',
  'Wednesday–Sunday · 12–2 PM, 3–5 PM, 6–8 PM',
  '["Private studio session for your group","Guided handbuilding experience","Studio materials"]'::jsonb,
  '[{"id":"food-wine","label":"Food & Wine","price":3500,"checkoutEnabled":true,"pageNote":"Optional food and beverages for your group — add at checkout."}]'::jsonb,
  1,
  true
)
ON CONFLICT (id) DO NOTHING;
