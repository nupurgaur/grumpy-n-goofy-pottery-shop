export type BlogBlock =
  | { type: "paragraph"; text: string; introduces?: string }
  | { type: "heading"; text: string; accentWord: string };

export interface BlogPost {
  slug: string;
  series: string;
  title: string;
  titleAccentWord: string;
  excerpt: string;
  publishedAt: string;
  blocks: BlogBlock[];
}

export const BLOG_POSTS: BlogPost[] = [
  {
    slug: "everything-you-didnt-know-about-clay",
    series: "BLOG 1 — Clay Bodies",
    title: "Everything You Didn't Know About Clay (But Should)",
    titleAccentWord: "Clay",
    excerpt:
      "Clay bodies are recipes — carefully balanced formulas where every ingredient has a job. Here's what I learned from five days deep in clay body chemistry.",
    publishedAt: "2025-06-13",
    blocks: [
      {
        type: "paragraph",
        text: "Most people think clay is just… dirt you dig up and throw on a wheel. And honestly, before I spent five days deep in clay body chemistry with Sandeep sir, I wasn't too far off from thinking the same. But clay bodies are recipes — carefully balanced formulas where every single ingredient has a job. Change one thing, and you change everything.",
      },
      {
        type: "paragraph",
        text: "Here's what I learned, broken down properly.",
      },
      {
        type: "heading",
        text: "What even is a clay body?",
        accentWord: "clay",
      },
      {
        type: "paragraph",
        text: "A clay body is not one material. It's a blend of multiple raw materials, each contributing something specific — plasticity, structure, colour, strength, or workability. The final recipe depends entirely on what you're making and how you're making it. A clay body for wheel throwing looks completely different from one for slip casting, which looks different again from one built for tiles and murals.",
      },
      {
        type: "paragraph",
        text: "Before you can build a clay body, you need to understand the ingredients.",
      },
      {
        type: "heading",
        text: "The raw materials, and what they actually do",
        accentWord: "materials",
      },
      {
        type: "paragraph",
        introduces: "China Clay (Kaolin)",
        text: "China Clay (Kaolin) is the purest form of clay — white, clean, with low plasticity and shrinkage up to 8%. It fires anywhere between 1220–1450°C, making it one of the most versatile and high-firing clays available. Because it's not very plastic on its own, it's rarely used alone — but it's a foundational ingredient in almost every light clay body.",
      },
      {
        type: "paragraph",
        introduces: "Levigated China Clay",
        text: "Levigated China Clay is essentially refined kaolin — finer particle size, slightly more workable, firing between 1300–1400°C. The levigation process removes impurities and larger particles, giving you a cleaner, more consistent material.",
      },
      {
        type: "paragraph",
        introduces: "Fire Clay",
        text: "Fire Clay is the workhorse of functional ceramics. It's coarse, refractory, and has low plasticity — which is actually a feature, not a bug. Low plasticity means less shrinkage during drying and firing, which makes it ideal for mechanical forming processes: slip casting, tile-making, and jigger-jolly production. If you're making flat work or anything that needs to stay dimensionally stable, fire clay is your foundation.",
      },
      {
        type: "paragraph",
        introduces: "Ball Clay",
        text: "Ball Clay sits at the opposite end of the spectrum. It's extremely plastic, fine-grained, and fires to a buff or cream colour up to about 1350°C. That high plasticity makes it brilliant for hand-building and wheel throwing, but it comes with high shrinkage — so it's always balanced with less plastic materials in a recipe.",
      },
      {
        type: "paragraph",
        introduces: "White Bentonite",
        text: "White Bentonite is a plasticity booster used in tiny amounts — typically no more than 5%. It fires between 1330–1430°C. A small addition makes a significant difference to workability without dramatically affecting the fired result.",
      },
      {
        type: "paragraph",
        introduces: "Grey Bentonite",
        text: "Grey Bentonite plays the same role but is stickier, more plastic, and can be added up to 10–15%. It fires lower, between 1100–1250°C, and leaves a slightly darker tone after firing. If you need serious plasticity, grey bentonite delivers it.",
      },
      {
        type: "paragraph",
        introduces: "Red Terracotta",
        text: "Red Terracotta brings iron into the picture. That iron content gives it a warm, characteristic red colour after firing, and it fires at a lower temperature than most clay bodies — 950–1100°C. It's what most traditional terracotta pots are made from.",
      },
      {
        type: "paragraph",
        introduces: "Yellow Terracotta",
        text: "Yellow Terracotta has high iron content and high alkaline levels. It fires between 1200–1250°C and produces a warm buff-golden tone rather than the deeper red of its counterpart. The two terracottas behave similarly in forming but fire to distinctly different colours.",
      },
      {
        type: "paragraph",
        introduces: "Feldspar",
        text: "Feldspar is not a clay at all — it's a flux mineral. In a clay body, its job is to determine vitrification. Feldspar melts during firing and creates a glassy phase within the clay matrix, binding everything together and making the piece dense, hard, and non-porous. It fires between 1150–1350°C, and how much feldspar you include directly controls how vitrified your final piece will be.",
      },
      {
        type: "paragraph",
        introduces: "Silica (Quartz)",
        text: "Silica (Quartz) is a structural filler. It reduces shrinkage, raises the overall melting point, and — importantly — aids glaze adherence to the clay body. The silica in your clay and the silica in your glaze bond during firing, which is part of why glaze fit matters so much.",
      },
      {
        type: "paragraph",
        introduces: "Grog (fired and ground clay)",
        text: "Grog (fired and ground clay) reduces shrinkage further and opens up the clay body texture. It's used primarily in tile and mural bodies where flatness and dimensional stability are critical.",
      },
      {
        type: "heading",
        text: "The hands-on test that changed how I see materials",
        accentWord: "test",
      },
      {
        type: "paragraph",
        text: "On the first day of the course, we were given all ten raw materials and asked to do something simple — add water, roll small balls, and feel how each one behaved. How much water did it absorb? How did it feel in your hand? How well did it hold its shape?",
      },
      {
        type: "paragraph",
        text: "China clay felt almost non-responsive. Ball clay was immediately clingy and workable. Grey bentonite was shockingly sticky — just a small amount clung to everything. Fire clay felt gritty and resistant. Feldspar and silica felt more like powder than clay — because they essentially are.",
      },
      {
        type: "paragraph",
        text: "That exercise sounds basic, but it was one of the most useful things I've done in ceramics. When you know what a material feels like in isolation, you understand what it's contributing when you blend it.",
      },
      {
        type: "heading",
        text: "How clay body recipes actually work",
        accentWord: "recipes",
      },
      {
        type: "paragraph",
        text: "Once you understand the ingredients, the recipes start to make sense logically.",
      },
      {
        type: "paragraph",
        text: "For hand-building and wheel throwing, you need plasticity above all else. That means Ball clay as the primary ingredient (around 45% in a light body), supported by China clay for cleanliness, Feldspar for vitrification, Silica for structure, and a small amount of Bentonite for extra workability. Fire clay is too coarse and rigid for throwing — it'll fight you on the wheel.",
      },
      {
        type: "paragraph",
        text: "For tiles and murals, the priorities flip. You need low shrinkage and dimensional stability, which means Fire clay takes over as the backbone. Grog is added (around 10%) to reduce shrinkage further, and the recipe includes enough China clay and Feldspar to hold everything together through firing.",
      },
      {
        type: "paragraph",
        text: "For slip casting, Fire clay again leads — its low plasticity reduces shrinkage inside the plaster mould, which is exactly what you want. No grog is needed here because the mould itself provides the shape. Two deflocculants — Soda Ash and Sodium Silicate — are added to the liquid slip to keep it fluid without needing excess water.",
      },
      {
        type: "paragraph",
        text: "For dark clay bodies, the logic is the same but the colouring materials change. Red or Yellow Terracotta replaces Ball or Fire clay (at 55–60%). Feldspar is capped at just 5% because terracotta doesn't need as much vitrification push. Silica can go up to 20%, and China clay stays around 15–20% for structure.",
      },
      {
        type: "heading",
        text: "What the fired results showed",
        accentWord: "fired",
      },
      {
        type: "paragraph",
        text: "After making test tiles in six different clay body types and firing them, the differences were striking. The wheel and tile bodies came out exactly as expected — good vitrification, colours as predicted, appropriate shrinkage. The slip cast light body, though, was over-absorbent after firing, which indicated incomplete vitrification. The fix was straightforward once diagnosed: increase Feldspar to push vitrification, and reduce Silica to balance.",
      },
      {
        type: "paragraph",
        text: "That correction process is the whole point of test tiles. You don't guess. You test, you read the result, and you adjust based on what the material is telling you.",
      },
      {
        type: "heading",
        text: "The bigger picture",
        accentWord: "picture",
      },
      {
        type: "paragraph",
        text: "Understanding clay body chemistry doesn't make ceramics less intuitive — it makes your intuition more accurate. When something goes wrong, you know where to look. When something goes right, you know why and can repeat it. Every ingredient has a reason, every ratio has a consequence, and every firing tells you something. That's not chemistry making ceramics clinical. That's chemistry making ceramics honest.",
      },
    ],
  },
  {
    slug: "how-i-built-my-base-glaze-from-scratch",
    series: "BLOG 2 — Base Glaze Development",
    title:
      "How I Built My Base Glaze From Scratch (And What the Other Experiments Taught Me)",
    titleAccentWord: "Glaze",
    excerpt:
      "After five days of systematic glaze testing, here's how my Dolomite base glaze came together — and what the rest of the class learned from their flux experiments.",
    publishedAt: "2025-06-14",
    blocks: [
      {
        type: "paragraph",
        text: "Developing a glaze from scratch sounds intimidating. It's chemistry, it involves a kiln, and there are about a hundred variables that can go wrong. But after five days of systematic testing during my clay and glaze chemistry course with Sandeep sir, I've come to think of glaze development less like a science experiment and more like a conversation — you make a proposal, the kiln responds, and you adjust.",
      },
      {
        type: "paragraph",
        text: "Here's the full story of how my base glaze came together, alongside what the rest of the class was discovering with their own flux experiments.",
      },
      {
        type: "heading",
        text: "Why glaze needs a flux in the first place",
        accentWord: "flux",
      },
      {
        type: "paragraph",
        introduces: "Silica",
        text: "Silica is the glass-forming backbone of every glaze. But its melting point is 1700°C — far beyond what most kilns reach, and far beyond what most clay bodies can handle. So we add fluxes — materials that lower the melting point of silica to a workable temperature.",
      },
      {
        type: "paragraph",
        introduces: "Alumina",
        text: "But flux alone would cause the glaze to run right off the piece. So we also add Alumina, which holds the melt in place and gives the glaze its structure.",
      },
      {
        type: "paragraph",
        text: "The combination of silica (glass former), flux (melter), and alumina (stabiliser) is the foundation of every glaze that has ever existed.",
      },
      {
        type: "heading",
        text: "The four fluxes, and what we observed firing them individually",
        accentWord: "fluxes",
      },
      {
        type: "paragraph",
        text: "Before building any glaze recipes, Sandeep sir had us fire each flux on its own — just to see what they do without the support of a full glaze composition. The results were revealing.",
      },
      {
        type: "paragraph",
        introduces: "Dolomite (MgCO₃ + CaCO₃, firing range 1130–1250°C)",
        text: "Dolomite (MgCO₃ + CaCO₃, firing range 1130–1250°C) — crumbled to powder after firing. Cannot hold its form alone.",
      },
      {
        type: "paragraph",
        introduces: "Calcium Carbonate (CaCO₃, 1100–1300°C)",
        text: "Calcium Carbonate (CaCO₃, 1100–1300°C) — same result. Dissolved completely and became powder after the kiln.",
      },
      {
        type: "paragraph",
        introduces: "Barium Carbonate (BaCO₃, 900–1360°C)",
        text: "Barium Carbonate (BaCO₃, 900–1360°C) — stuck to the kiln shelf while still wet, and also broke down to powder after firing. Worth noting: Barium is not food safe and is used for decorative work only.",
      },
      {
        type: "paragraph",
        introduces: "Zinc Oxide (ZnO₂, 1000–1250°C)",
        text: "Zinc Oxide (ZnO₂, 1000–1250°C) — the outlier. It remained solid after firing, the only flux that held its physical form on its own.",
      },
      {
        type: "paragraph",
        text: "The takeaway from this exercise wasn't just interesting — it was fundamental. Individually, these materials do nothing useful. It's only when you combine them as modifiers within a balanced glaze composition that they create real impact — controlling surface quality, melt temperature, opacity, and texture. The flux is not the glaze. It's one instrument in an ensemble.",
      },
      {
        type: "heading",
        text: "The first round: my Dolomite tiles (D1–D6)",
        accentWord: "Dolomite",
      },
      {
        type: "paragraph",
        text: "Each student was assigned one flux to develop a base glaze from. Mine was Dolomite. The recipe structure was simple: vary the ratio of Feldspar to Dolomite across six tiles, while keeping Silica fixed at 2 parts and China Clay fixed at 1 part throughout.",
      },
      {
        type: "paragraph",
        text: "Tile D1 had the most Dolomite and the least Feldspar. D6 flipped that completely. The results ranged from underfired and rough to overly matte and dry. D5 — Feldspar 5, Dolomite 2, Silica 2, China Clay 1 — gave the most promising surface. Not perfect, but the closest to a workable matte finish.",
      },
      {
        type: "heading",
        text: "What the other flux experiments showed",
        accentWord: "experiments",
      },
      {
        type: "paragraph",
        text: "While I was working on Dolomite, the rest of the class was developing glazes from Zinc, Calcium Carbonate, and Barium Carbonate. Here's what each series revealed after firing:",
      },
      {
        type: "paragraph",
        introduces: "Zinc series —",
        text: "Zinc series — Zinc produces a crystalline effect when used as a primary flux, which is beautiful but unpredictable. Adding China Clay to the Zinc base caused an opaque, whitish surface. The class finalised tile Z13, which gave a clean, defined crystalline effect without opacity.",
      },
      {
        type: "paragraph",
        introduces: "Calcium Carbonate series —",
        text: "Calcium Carbonate series — This was the star of the class. Almost all tiles produced gorgeous, glossy results. C12 and C11 had minor pinholes, but C10 came out near-perfect — and crucially, it contained no Barium, making it the safest choice for functional work. C10 was the class favourite.",
      },
      {
        type: "paragraph",
        introduces: "Barium Carbonate series —",
        text: "Barium Carbonate series — Barium is the most complex flux to work with. Barium combined with Dolomite and CaCO₃ gave a glossy effect. Barium with Dolomite alone gave matte. Barium with Zinc became slightly opaque. Combining half CaCO₃ and 0.5 Zinc gave a white, opaque effect. Adding Dolomite and Zinc together brought opacity back. The class finalised B10 — a combination of 0.5 CaCO₃ and 0.5 Dolomite — which found a balance between the glossy and matte tendencies of Barium.",
      },
      {
        type: "heading",
        text: "Round two: six more Dolomite experiments (D7–D12)",
        accentWord: "experiments",
      },
      {
        type: "paragraph",
        introduces: "Talc (Mg₃Si₄O₁₀(OH)₂)",
        text: "Taking D5 as my base and reducing Feldspar to 4, I introduced three different fluxes — Talc (Mg₃Si₄O₁₀(OH)₂), Zinc, and Calcium Carbonate — in various combinations across six new tiles.",
      },
      {
        type: "paragraph",
        text: "D7 added Talc alone (1g). D8 added Zinc alone (1g). D9 added CaCO₃ alone (1g). D10 combined Talc and Zinc at 0.5g each. D11 combined Talc and CaCO₃ at 0.5g each. D12 combined Zinc and CaCO₃ at 0.5g each.",
      },
      {
        type: "paragraph",
        text: "The elimination process was quick. Any tile containing Zinc turned glossy — which was not the surface I wanted. D8, D9 with zinc influence, and D12 were out. D7, with only Talc, turned opaque. D9 with only CaCO₃ also had opacity. D10 with Talc and Zinc gave an interesting textured, flowery surface — beautiful, but not what I was after for a base.",
      },
      {
        type: "paragraph",
        text: "That left D11. Talc and CaCO₃ together, at just 0.5g each, produced a soft, non-opaque matte with excellent surface quality. No glossiness. No opacity. Exactly what I'd been working toward.",
      },
      {
        type: "heading",
        text: "Scaling D11 to production",
        accentWord: "production",
      },
      {
        type: "paragraph",
        text: "The final recipe — Feldspar 4, Dolomite 2, Silica 2, China Clay 1, Talc 0.5, CaCO₃ 0.5 — was scaled to a 1.5 kg batch by multiplying every ingredient by 150. That gave: Feldspar 600g, Dolomite 300g, Silica 300g, China Clay 150g, Talc 75g, Calcium Carbonate 75g.",
      },
      {
        type: "paragraph",
        text: "1.5 kg of base glaze, in powder form, ready to be mixed with water and applied to bisqueware. After two days and twelve test tiles, the base glaze was done.",
      },
      {
        type: "heading",
        text: "What this process taught me about glaze development",
        accentWord: "development",
      },
      {
        type: "paragraph",
        text: "You cannot shortcut systematic testing. Every tile that didn't work wasn't a failure — it was information. Knowing that Zinc makes my Dolomite glaze glossy is just as useful as knowing that Talc and CaCO₃ together make it perfect. Both pieces of knowledge are now part of how I'll approach every future glaze I develop.",
      },
      {
        type: "paragraph",
        text: "The kiln is not guessing. It's answering your questions, exactly and honestly, every single time.",
      },
    ],
  },
  {
    slug: "oxides-opacifiers-and-stains",
    series: "BLOG 3 — Oxides, Opacifiers & Stains",
    title:
      "The Colour Issue: A Deep Dive Into Oxides, Opacifiers, and Stains in Ceramics",
    titleAccentWord: "Colour",
    excerpt:
      "Colour in ceramics fuses into molten glass at 1200°C — here's what I learned from test tiles exploring oxides, opacifiers, and stains.",
    publishedAt: "2025-06-15",
    blocks: [
      {
        type: "paragraph",
        text: "Colour in ceramics is not paint. It doesn't sit on top of a surface — it fuses into molten glass at temperatures upward of 1200°C, transforms chemically, and emerges from the kiln as something fundamentally different from what went in. That's why the same oxide can produce a completely different colour depending on the base glaze, the percentage used, the firing temperature, and the kiln atmosphere.",
      },
      {
        type: "paragraph",
        text: "During the third, fourth, and fifth days of my clay and glaze chemistry course with Sandeep sir, we went deep into this — oxides, opacifiers, and stains — through a series of increasingly complex test tile experiments. Here's everything I learned.",
      },
      {
        type: "heading",
        text: "What are metal oxides?",
        accentWord: "oxides",
      },
      {
        type: "paragraph",
        text: "Metal oxides are compounds of a metal and oxygen that produce colour when fired inside a glaze. They don't behave like pigments — they react chemically with the glaze matrix at high temperature and become part of the glass itself. This is why ceramic colours have depth that paint simply cannot replicate.",
      },
      {
        type: "paragraph",
        text: "Each oxide has its own personality, its own colour range, and its own sensitivity to the base glaze it sits in.",
      },
      {
        type: "paragraph",
        introduces: "Cobalt Oxide",
        text: "Cobalt Oxide — the strongest colourant in the list. Produces an intense vivid blue at just 0.5–2%. Use more and it becomes overwhelming. Even 4% pushes it toward a near-black navy. Handle with restraint.",
      },
      {
        type: "paragraph",
        introduces: "Copper Oxide",
        text: "Copper Oxide — produces green in oxidation firing, but in a reduction kiln (where oxygen is limited), it can shift to red. The same material, the same percentage, two completely different results depending on your kiln atmosphere. Copper is the most atmosphere-sensitive common oxide.",
      },
      {
        type: "paragraph",
        introduces: "Chromium Oxide",
        text: "Chromium Oxide — stable, reliable olive-green across most base glazes. Less reactive to atmosphere than copper, which makes it predictable but also limited in its range.",
      },
      {
        type: "paragraph",
        introduces: "Iron Oxide",
        text: "Iron Oxide — the most versatile oxide in the kiln. At low percentages (1–4%), it gives soft amber and tan tones. Push it to 12% and it becomes dark brown to near-black. It's the oxide that's been in ceramics longest, and it rewards experimentation more than almost any other.",
      },
      {
        type: "paragraph",
        introduces: "Manganese Dioxide",
        text: "Manganese Dioxide — produces purple-brown tones that can become speckled or mottled on the surface, especially in Dolomite-based glazes. It has a distinctive texture quality that sets it apart from flatter oxides.",
      },
      {
        type: "paragraph",
        introduces: "Nickel Oxide",
        text: "Nickel Oxide — muted, quiet greens and greys. Often used not to add colour but to tone down or dirty other colours, making them feel more natural and less synthetic.",
      },
      {
        type: "paragraph",
        introduces: "Vanadium Pentoxide",
        text: "Vanadium Pentoxide — a soft, delicate yellow that's almost invisible without an opacifier beneath it. Comes alive when used over a white base.",
      },
      {
        type: "heading",
        text: "The opacifier question",
        accentWord: "opacifier",
      },
      {
        type: "paragraph",
        text: "Oxides alone produce colour, but they produce it within a translucent glaze. An opacifier changes that. It scatters light within the glaze layer, creating a white or near-white reflective base — and when a colourant sits in or on that base, the colour becomes brighter, cleaner, and more even.",
      },
      {
        type: "paragraph",
        text: "We worked with three opacifiers, and each one behaves differently.",
      },
      {
        type: "paragraph",
        introduces: "Tin Oxide",
        text: "Tin Oxide — the classic. Used at around 4% (1g per 25g glaze), it gives a soft, dense, creamy white. It's the warmest of the three and the most forgiving. Tin oxide has been used in ceramics for centuries for exactly this reason.",
      },
      {
        type: "paragraph",
        introduces: "Titanium Dioxide",
        text: "Titanium Dioxide — warmer toned than you'd expect from a white opacifier. At 8% (2g per 25g), it can create subtle texture or even small crystalline formations in the surface. More unpredictable than tin, but that unpredictability is often beautiful.",
      },
      {
        type: "paragraph",
        introduces: "Zirconium Silicate",
        text: "Zirconium Silicate — the strongest and most neutral. At 16% (4g per 25g), it gives a greyish white — clean, stable, and consistent across almost any base glaze or temperature. The most reliable choice for production work.",
      },
      {
        type: "heading",
        text: "The 11-tile oxide experiment",
        accentWord: "experiment",
      },
      {
        type: "paragraph",
        text: "Our first oxide exercise was straightforward — eleven bags of 25g base glaze, each with a different oxide or opacifier added in a fixed amount. Mixed with 20–30ml water, sieved three times, and applied to bisque tiles.",
      },
      {
        type: "paragraph",
        text: "The results taught us about each oxide's raw behaviour within our specific Dolomite base. Cobalt was strikingly blue at just 2%. Copper gave a soft sage green. Chromium produced a flat, muted olive. Iron at 4% gave warm amber; Iron at 12% went almost black. Manganese produced a mottled purple-brown. Nickel gave a grey-green that looked almost weathered. Vanadium was barely visible — a whisper of yellow that needed context to read as a colour at all.",
      },
      {
        type: "heading",
        text: "The 24-tile combination experiment",
        accentWord: "combination",
      },
      {
        type: "paragraph",
        text: "The second experiment was more revealing. We took the same eight oxides and combined each one with each of the three opacifiers — 24 tiles in total, each showing what happens when opacity and colour are introduced simultaneously.",
      },
      {
        type: "paragraph",
        text: "The results showed how dramatically the opacifier alters the oxide. Cobalt over Tin Oxide became a sky blue rather than deep navy. Cobalt over Zirconium stayed rich and vivid. Copper over Titanium Dioxide picked up warmth and some texture. Iron at low percentage over any opacifier produced a range of tans and biscuit tones that looked completely different from iron on a clear base. Vanadium finally appeared — over all three opacifiers, it produced a clear, soft yellow that simply didn't exist without the white base underneath.",
      },
      {
        type: "paragraph",
        text: "The pattern across all 24 tiles was consistent: the opacifier doesn't just lighten the colour. It changes its character entirely. A glaze is never just glaze + oxide. It's a system, and every component affects every other.",
      },
      {
        type: "heading",
        text: "What are stains, and how are they different from oxides?",
        accentWord: "stains",
      },
      {
        type: "paragraph",
        text: "Stains are not raw materials — they're manufactured products. Each stain is made by combining metal oxides with modifiers and stabilisers, then processing the mixture at high temperature. The result is a stable, pre-reacted colourant that fires consistently across a wide range of temperatures and base glazes.",
      },
      {
        type: "paragraph",
        text: "Raw oxides are unpredictable. They react differently in different base glazes, at different temperatures, in different kiln atmospheres. Stains have already done that reaction. They give you reproducible, consistent colour every time — which makes them invaluable for production work.",
      },
      {
        type: "heading",
        text: "In-glaze, underglaze, and onglaze — the three ways to add colour",
        accentWord: "colour",
      },
      {
        type: "paragraph",
        text: "Before we tested stains, Sandeep sir explained the three main approaches to colouring ceramic work.",
      },
      {
        type: "paragraph",
        introduces: "In-glaze",
        text: "In-glaze (what we did in this exercise) means mixing the colourant directly into the liquid glaze before application. The colour fires within the glaze layer and fuses completely with it. This gives a unified, integrated surface — the colour and the glaze are one thing.",
      },
      {
        type: "paragraph",
        introduces: "Underglaze",
        text: "Underglaze means applying colour to raw or bisqued clay before the glaze goes on. A transparent or semi-transparent glaze is then applied over the top. The colour shows through the glass layer above it — good for fine detail, painting, and imagery. The colour is protected by the glaze but sits beneath it, not within it.",
      },
      {
        type: "paragraph",
        introduces: "Onglaze",
        text: "Onglaze (or overglaze) is colour applied to an already-fired and glazed surface, then re-fired at a much lower temperature. The lowest-fire option of the three, used for the finest decorative detail. Delicate, but capable of the most precise imagery.",
      },
      {
        type: "paragraph",
        text: "Our exercise was in-glaze — mixing stains directly into base glaze.",
      },
      {
        type: "heading",
        text: "The stain experiment",
        accentWord: "stain",
      },
      {
        type: "paragraph",
        text: "We worked with 33 stain colours, each with a recommended base glaze. Some stains work best in a Calcium Carbonate base. Some require a Dolomite base for the right colour response. Some — particularly the brown and terracotta tones — work best in a Zinc base. A few require a base glaze without zinc entirely, because zinc reacts with certain stain pigments and shifts the colour unpredictably.",
      },
      {
        type: "paragraph",
        text: "Each student received 16 colours to test. Eight tiles were mixed without opacifier — stain directly into base glaze. Eight more used the same stains but with 4g of Zirconium Silicate added to each 25g of glaze. Across the class, 66 test tiles were produced in this session alone.",
      },
      {
        type: "paragraph",
        text: "The difference between the opacifier and non-opacifier sets was striking across the board. Without opacifier, stain colours sat within a translucent glaze — softer, more complex, with the clay body slightly visible beneath. With Zirconium Silicate, the colours became clean, flat, and saturated — sitting on a white ground like watercolour on bright paper.",
      },
      {
        type: "paragraph",
        text: "Neither version is better. They're different tools for different intentions.",
      },
      {
        type: "heading",
        text: "What this all adds up to",
        accentWord: "system",
      },
      {
        type: "paragraph",
        text: "Colour in ceramics is a system, not a decision. The oxide or stain is just one variable. The base glaze it sits in matters. The opacifier beneath it matters. The percentage matters. The firing temperature matters. The kiln atmosphere matters.",
      },
      {
        type: "paragraph",
        text: "Understanding all of these things doesn't make the process less creative. It makes it more intentional. When you know why a colour does what it does, you can make choices instead of guesses — and your work becomes more fully yours, because you're in conversation with the material rather than just hoping it cooperates.",
      },
    ],
  },
];

export const getBlogPost = (slug: string) =>
  BLOG_POSTS.find((post) => post.slug === slug) ?? null;

export const formatBlogDate = (isoDate: string) =>
  new Date(isoDate).toLocaleDateString("en-IN", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
