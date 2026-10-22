-- Workshop catalog for admin-managed experiences

CREATE TABLE IF NOT EXISTS public.workshop_tabs (
  id TEXT PRIMARY KEY,
  label TEXT NOT NULL,
  tagline TEXT NOT NULL DEFAULT '',
  is_visible BOOLEAN NOT NULL DEFAULT true,
  sort_order INTEGER NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.workshop_experiences (
  id TEXT PRIMARY KEY,
  tab_id TEXT NOT NULL REFERENCES public.workshop_tabs(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  tagline TEXT NOT NULL DEFAULT '',
  description TEXT NOT NULL DEFAULT '',
  duration TEXT,
  price NUMERIC(10, 2) NOT NULL DEFAULT 0,
  price_label TEXT NOT NULL DEFAULT '',
  additional_note TEXT,
  image_url TEXT NOT NULL DEFAULT '',
  is_visible BOOLEAN NOT NULL DEFAULT true,
  sort_order INTEGER NOT NULL DEFAULT 0,
  time_slot TEXT,
  includes JSONB NOT NULL DEFAULT '[]'::jsonb,
  add_ons JSONB NOT NULL DEFAULT '[]'::jsonb,
  firing_note TEXT,
  message_card TEXT,
  status_text TEXT,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.workshop_tabs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workshop_experiences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Workshop tabs are viewable by everyone"
  ON public.workshop_tabs FOR SELECT USING (true);

CREATE POLICY "Workshop experiences are viewable by everyone"
  ON public.workshop_experiences FOR SELECT USING (true);

CREATE POLICY "Admins can manage workshop tabs"
  ON public.workshop_tabs FOR ALL
  USING (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can manage workshop experiences"
  ON public.workshop_experiences FOR ALL
  USING (public.has_role(auth.uid(), 'admin'::app_role));

INSERT INTO public.workshop_tabs (id, label, tagline, is_visible, sort_order) VALUES
  ('one-time', 'One-Time Experiences', 'Drop in for a single creative session — no commitment, just clay and fun.', true, 1),
  ('date-night', 'Date Night', 'A memorable evening making pottery together — perfect for couples.', true, 2),
  ('courses', 'Courses', 'Multi-week programs to build real pottery skills from the ground up.', true, 3)
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.workshop_experiences (
  id, tab_id, title, tagline, description, duration, price, price_label, additional_note, image_url, sort_order
) VALUES
  (
    'paint-your-own-pot', 'one-time', 'Paint Your Own Pot',
    'A relaxed intro to colour and glaze — walk in, paint bisque, and take home something cheerful.',
    'Paint and personalise a ready-made ceramic piece using studio glazes and colours. Perfect for beginners, friends, families, and casual creative sessions.',
    '1 Hour', 1000, '₹1000 per person', NULL, '/workshops/paint-your-own-pot.png', 1
  ),
  (
    'handbuilding-ceramics', 'one-time', 'Handbuilding Ceramics',
    'Shape clay with your hands — roll slabs, build forms, and leave with pieces you made yourself.',
    'Learn slab-building and handbuilding techniques to create your own mugs, trays, bowls, and decorative pieces.',
    '2 Hours', 1800, '₹1800 per person', NULL, '/workshops/handbuilding.png', 2
  ),
  (
    'wheel-throwing', 'one-time', 'Wheel Throwing',
    'Feel the wheel spin beneath your fingers — a classic studio experience with guided support.',
    'Experience the pottery wheel and create your own clay forms with guided instruction.',
    '2 Hours', 1500, '₹1500 per person', 'Firing and glazing available at ₹400 per finished piece.',
    '/workshops/wheel-throwing.png', 3
  )
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.workshop_experiences (
  id, tab_id, title, tagline, description, price, price_label, image_url,
  time_slot, includes, add_ons, firing_note, message_card, sort_order
) VALUES (
  'date-night', 'date-night', 'Clay Date Night',
  'Skip the usual dinner date — laugh, create, and make keepsakes you''ll actually keep.',
  'Looking for a unique date idea? Spend an evening creating together, sharing laughs, and making something meaningful with your hands.',
  3200, '₹3200 per couple', '/workshops/date-night.png',
  '6:00 PM – 8:00 PM',
  '["Guided pottery experience","Shared creative session","Studio materials"]'::jsonb,
  '["Wine","Snacks"]'::jsonb,
  'Firing and glazing of finished pieces available at an additional cost.',
  'A thoughtful alternative to dinner dates — create memories and keepsakes together.',
  1
) ON CONFLICT (id) DO NOTHING;

INSERT INTO public.workshop_experiences (
  id, tab_id, title, tagline, description, price, price_label, image_url, status_text, sort_order
) VALUES (
  'courses-main', 'courses', 'Structured Pottery Courses',
  '',
  'We''re working on beginner and intermediate pottery programs covering handbuilding, wheel throwing, glazing, and clay fundamentals.',
  0, '', '', 'Coming Soon.', 1
) ON CONFLICT (id) DO NOTHING;
