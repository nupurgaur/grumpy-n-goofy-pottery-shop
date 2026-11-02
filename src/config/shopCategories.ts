/** Shop category labels + one-liners (category pages) */
export const SHOP_CATEGORIES = [
  {
    value: "mugs",
    label: "Mugs",
    tagline: "Morning coffee deserves a mug with a little personality.",
  },
  {
    value: "bowls",
    label: "Bowls",
    tagline: "For ramen nights, cereal days, and cozy spoonfuls.",
  },
  {
    value: "plates",
    label: "Plates",
    tagline: "Small plates for snacks, sides, and everyday rituals.",
  },
  {
    value: "ceramic-clocks",
    label: "Ceramic Clocks",
    tagline: "Timekeeping with a handmade heartbeat.",
  },
  {
    value: "lamps",
    label: "Lamps",
    tagline: "Soft clay light for slow evenings at home.",
  },
  {
    value: "spoon-rests",
    label: "Spoon Rests",
    tagline: "Tiny pedestals for spoons between stirs.",
  },
  {
    value: "vases",
    label: "Vases",
    tagline: "For single stems, wild bouquets, and quiet shelves.",
  },
  {
    value: "kitchen-towel-holders",
    label: "Kitchen Towel Holder",
    tagline: "Keep tea towels tidy with a little clay character.",
  },
  {
    value: "tea-light-holders",
    label: "Tea-Light Holders",
    tagline: "A warm flicker in handmade ceramic.",
  },
] as const;

export const getShopCategoryMeta = (categoryValue: string) =>
  SHOP_CATEGORIES.find((cat) => cat.value === categoryValue) ?? null;
