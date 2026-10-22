/** Workshop booking configuration */

import { format } from "date-fns";

export type WorkshopTopTab =
  | "one-time"
  | "date-night"
  | "private-parties"
  | "courses";

export type OneTimeExperienceId =
  | "paint-your-own-pot"
  | "handbuilding-ceramics"
  | "wheel-throwing";

export type WorkshopScheduleId =
  | OneTimeExperienceId
  | "date-night"
  | "private-clay-parties";

export interface OneTimeExperience {
  id: OneTimeExperienceId;
  title: string;
  tagline: string;
  description: string;
  duration: string;
  price: number;
  priceLabel: string;
  additionalNote?: string;
  imageUrl: string;
}

export const STUDIO_OPEN_DATE = new Date(2026, 8, 1);

/** Hidden from the public workshop page until we bring them back */
export const PAUSED_ONE_TIME_EXPERIENCE_IDS: OneTimeExperienceId[] = [
  "paint-your-own-pot",
  "wheel-throwing",
];

/** Regular drop-in sessions stay small; larger groups book a private party */
export const MAX_ONE_TIME_TICKETS = 4;
export const MAX_DATE_NIGHT_TICKETS = 1;
export const MIN_PRIVATE_PARTY_TICKETS = 5;
export const MAX_PRIVATE_PARTY_TICKETS = 10;
export const MAX_WORKSHOP_TICKETS = MAX_PRIVATE_PARTY_TICKETS;
export const GROUP_BOOKING_THRESHOLD = 4;

export const FOOD_WINE_ADDON = {
  id: "food-wine",
  label: "Food & Wine",
  price: 3500,
} as const;

export const WORKSHOP_TIME_SLOTS = [
  "12:00 PM – 2:00 PM",
  "3:00 PM – 5:00 PM",
  "6:00 PM – 8:00 PM",
] as const;

export const WORKSHOP_SCHEDULE_NOTE =
  "Wednesday–Sunday · 12–2 PM, 3–5 PM, 6–8 PM";

export const WORKSHOP_PRODUCT_IDS: Record<WorkshopScheduleId, number> = {
  "paint-your-own-pot": 9991,
  "handbuilding-ceramics": 9992,
  "wheel-throwing": 9993,
  "date-night": 9994,
  "private-clay-parties": 9995,
};

export const BOOKABLE_WORKSHOP_SCHEDULES: WorkshopScheduleId[] = [
  "handbuilding-ceramics",
  "date-night",
  "private-clay-parties",
];

export const WORKSHOP_PLACEHOLDER_PRODUCT_IDS = Object.values(WORKSHOP_PRODUCT_IDS);

export type WorkshopProduct = {
  id?: number;
  is_workshop?: boolean | null;
};

export function isWorkshopProduct(product: WorkshopProduct): boolean {
  if (product.is_workshop === true) return true;
  return product.id != null && WORKSHOP_PLACEHOLDER_PRODUCT_IDS.includes(product.id);
}

export const WORKSHOP_CART_ID_MIN = 9900000;
export const WORKSHOP_CART_ID_MAX = 9999999;

/** Unique cart line id per workshop date + slot (avoids cart_items unique constraint) */
export const getWorkshopCartProductId = (
  scheduleId: WorkshopScheduleId,
  date: Date,
  slot: string,
): number => {
  const dateStr = format(date, "yyyyMMdd");
  const seed = `${scheduleId}|${dateStr}|${slot}`;
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = (hash * 31 + seed.charCodeAt(i)) >>> 0;
  }
  return WORKSHOP_CART_ID_MIN + (hash % 99999);
};

export const isWorkshopCartItem = (productId: number, productName: string) =>
  (productId >= WORKSHOP_CART_ID_MIN && productId <= WORKSHOP_CART_ID_MAX) ||
  productName.startsWith("Workshop —");

export function getWorkshopTicketLimits(scheduleId: WorkshopScheduleId): {
  min: number;
  max: number;
} {
  if (scheduleId === "private-clay-parties") {
    return { min: MIN_PRIVATE_PARTY_TICKETS, max: MAX_PRIVATE_PARTY_TICKETS };
  }
  if (scheduleId === "date-night") {
    return { min: 1, max: MAX_DATE_NIGHT_TICKETS };
  }
  return { min: 1, max: MAX_ONE_TIME_TICKETS };
}

export const TOP_WORKSHOP_TABS: {
  id: WorkshopTopTab;
  label: string;
  tagline: string;
}[] = [
  {
    id: "one-time",
    label: "One-Time Experiences",
    tagline:
      "Drop in for a single creative session — no commitment, just clay and fun.",
  },
  {
    id: "date-night",
    label: "Date Night",
    tagline:
      "A memorable evening making pottery together — perfect for couples.",
  },
  {
    id: "private-parties",
    label: "Private Clay Parties",
    tagline:
      "Kitty parties, birthdays, bridal showers — a private studio session for your group.",
  },
  {
    id: "courses",
    label: "Courses",
    tagline:
      "Multi-week programs to build real pottery skills from the ground up.",
  },
];

export const formatWorkshopPrice = (amount: number) =>
  `₹${amount.toLocaleString("en-IN")}`;

export const buildWorkshopCartName = (
  title: string,
  date: Date,
  slot: string,
) =>
  `Workshop — ${title} · ${format(date, "EEE, MMM d, yyyy")} · ${slot}`;

export const ONE_TIME_EXPERIENCES: OneTimeExperience[] = [
  {
    id: "paint-your-own-pot",
    title: "Paint Your Own Pot",
    tagline:
      "A relaxed intro to colour and glaze — walk in, paint bisque, and take home something cheerful.",
    description:
      "Paint and personalise a ready-made ceramic piece using studio glazes and colours. Perfect for beginners, friends, families, and casual creative sessions.",
    duration: "1 Hour",
    price: 1000,
    priceLabel: "₹1000 per person",
    imageUrl: "/workshops/paint-your-own-pot.png",
  },
  {
    id: "handbuilding-ceramics",
    title: "Handbuilding Ceramics",
    tagline:
      "Shape clay with your hands — roll slabs, build forms, and leave with pieces you made yourself.",
    description:
      "Learn slab-building and handbuilding techniques to create your own mugs, trays, bowls, and decorative pieces.",
    duration: "2 Hours",
    price: 1699,
    priceLabel: "₹1699 per person",
    additionalNote: "Firing and glazing available at ₹300 per finished piece.",
    imageUrl: "/workshops/handbuilding.png",
  },
  {
    id: "wheel-throwing",
    title: "Wheel Throwing",
    tagline:
      "Feel the wheel spin beneath your fingers — a classic studio experience with guided support.",
    description:
      "Experience the pottery wheel and create your own clay forms with guided instruction.",
    duration: "2 Hours",
    price: 1500,
    priceLabel: "₹1500 per person",
    additionalNote: "Firing and glazing available at ₹400 per finished piece.",
    imageUrl: "/workshops/wheel-throwing.png",
  },
];

export const DATE_NIGHT = {
  title: "Clay Date Night",
  tagline:
    "Skip the usual dinner date — laugh, create, and make keepsakes you'll actually keep.",
  description:
    "Looking for a unique date idea? Spend an evening creating together, sharing laughs, and making something meaningful with your hands.",
  imageUrl: "/workshops/date-night.png",
  time: WORKSHOP_SCHEDULE_NOTE,
  price: 3500,
  priceLabel: "₹3500 per couple",
  slot: WORKSHOP_TIME_SLOTS[2],
  includes: [
    "Guided pottery experience",
    "Shared creative session",
    "Studio materials",
  ],
  addOns: [`${FOOD_WINE_ADDON.label} — ${formatWorkshopPrice(FOOD_WINE_ADDON.price)}`],
  firingNote:
    "Firing and glazing of finished pieces available at an additional cost.",
  messageCard:
    "A thoughtful alternative to dinner dates — create memories and keepsakes together.",
};

export const PRIVATE_CLAY_PARTY = {
  title: "Private Clay Parties",
  tagline:
    "Celebrate with clay — a private studio session for kitty parties, birthdays, and bridal showers.",
  description:
    "Book the studio for your group of 5 to 10 people. Perfect for kitty parties, birthday gatherings, bridal showers, and other celebrations where you want a hands-on, private clay experience together.",
  imageUrl: "/workshops/handbuilding.png",
  duration: "2 Hours",
  price: 1599,
  priceLabel: "₹1599 per person",
  additionalNote:
    "Private group booking for more than 4 guests, up to 10 people. Same studio hours as our other experiences: Wednesday–Sunday, 12–2 PM, 3–5 PM, and 6–8 PM.",
  includes: [
    "Private studio session for your group",
    "Guided handbuilding experience",
    "Studio materials",
  ],
  addOns: [`${FOOD_WINE_ADDON.label} — ${formatWorkshopPrice(FOOD_WINE_ADDON.price)}`],
};

export const COURSES = {
  title: "Structured Pottery Courses",
  description:
    "We're working on beginner and intermediate pottery programs covering handbuilding, wheel throwing, glazing, and clay fundamentals.",
  status: "Coming Soon.",
};
