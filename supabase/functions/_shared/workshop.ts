const WORKSHOP_CART_ID_MIN = 9900000;
const WORKSHOP_CART_ID_MAX = 9999999;

export const WORKSHOP_ORDER_PRODUCT_IDS = {
  paintYourOwnPot: 9991,
  handbuilding: 9992,
  wheelThrowing: 9993,
  dateNight: 9994,
  privateClayParties: 9995,
} as const;

export function isWorkshopCartProductId(productId: number): boolean {
  return productId >= WORKSHOP_CART_ID_MIN && productId <= WORKSHOP_CART_ID_MAX;
}

export function isWorkshopCartItem(item: { product_id: number; product_name?: string }): boolean {
  return (
    isWorkshopCartProductId(item.product_id) ||
    String(item.product_name ?? '').startsWith('Workshop —')
  );
}

export function resolveWorkshopOrderProductId(productName: string): number {
  const name = productName.toLowerCase();

  if (name.includes('paint your own pot')) {
    return WORKSHOP_ORDER_PRODUCT_IDS.paintYourOwnPot;
  }
  if (name.includes('handbuilding')) {
    return WORKSHOP_ORDER_PRODUCT_IDS.handbuilding;
  }
  if (name.includes('wheel throwing')) {
    return WORKSHOP_ORDER_PRODUCT_IDS.wheelThrowing;
  }
  if (name.includes('date night') || name.includes('clay date')) {
    return WORKSHOP_ORDER_PRODUCT_IDS.dateNight;
  }
  if (name.includes('private clay')) {
    return WORKSHOP_ORDER_PRODUCT_IDS.privateClayParties;
  }

  return WORKSHOP_ORDER_PRODUCT_IDS.paintYourOwnPot;
}

type WorkshopScheduleId =
  | "paint-your-own-pot"
  | "handbuilding-ceramics"
  | "wheel-throwing"
  | "date-night"
  | "private-clay-parties";

function normalizeWorkshopSlot(slot: string): string {
  return slot.replace(/\u2013|\u2014/g, "–").replace(/\s+/g, " ").trim();
}

const MONTH_ABBR: Record<string, string> = {
  Jan: "01",
  Feb: "02",
  Mar: "03",
  Apr: "04",
  May: "05",
  Jun: "06",
  Jul: "07",
  Aug: "08",
  Sep: "09",
  Oct: "10",
  Nov: "11",
  Dec: "12",
};

function parseWorkshopCartNameDateToken(token: string): string | null {
  const match = token.match(/^([A-Za-z]{3}), ([A-Za-z]{3}) (\d{1,2}), (\d{4})$/);
  if (!match) return null;
  const month = MONTH_ABBR[match[2]];
  if (!month) return null;
  const day = match[3].padStart(2, "0");
  return `${match[4]}-${month}-${day}`;
}

function parseWorkshopCartName(productName: string): {
  title: string;
  sessionDate: string;
  slot: string;
} | null {
  const match = productName.match(
    /^Workshop — (.+?) · ([A-Za-z]{3}, [A-Za-z]{3} \d{1,2}, \d{4}) · (.+)$/,
  );
  if (!match) return null;

  const sessionDate = parseWorkshopCartNameDateToken(match[2]);
  if (!sessionDate) return null;

  return {
    title: match[1],
    sessionDate,
    slot: normalizeWorkshopSlot(match[3]),
  };
}

function resolveScheduleIdFromTitle(title: string): WorkshopScheduleId | null {
  const normalized = title.toLowerCase();
  if (normalized.includes("paint your own pot")) return "paint-your-own-pot";
  if (normalized.includes("handbuilding")) return "handbuilding-ceramics";
  if (normalized.includes("wheel throwing")) return "wheel-throwing";
  if (normalized.includes("date night") || normalized.includes("clay date")) {
    return "date-night";
  }
  if (normalized.includes("private clay")) return "private-clay-parties";
  return null;
}

export function resolveWorkshopBookingFromCartLine(item: {
  product_name: string;
  workshop_booking?: {
    scheduleId?: WorkshopScheduleId;
    sessionDate?: string;
    slot?: string;
    participants?: unknown[];
    addOns?: unknown[];
  } | null;
}): {
  scheduleId: WorkshopScheduleId;
  sessionDate: string;
  slot: string;
  participants: unknown[];
  addOns?: unknown[];
} | null {
  const parsed = parseWorkshopCartName(item.product_name);
  const stored = item.workshop_booking;

  const scheduleId = stored?.scheduleId ?? (parsed ? resolveScheduleIdFromTitle(parsed.title) : null);
  const sessionDate = stored?.sessionDate ?? parsed?.sessionDate;
  const slot = normalizeWorkshopSlot(stored?.slot?.trim() || parsed?.slot?.trim() || "");

  if (!scheduleId || !sessionDate || !slot) return null;

  return {
    scheduleId,
    sessionDate,
    slot,
    participants: stored?.participants ?? [],
    addOns: stored?.addOns,
  };
}

export function resolveOrderItemProductId(item: {
  product_id: number;
  product_name: string;
}, customPotProductId = 9999): number {
  if (isWorkshopCartItem(item)) {
    return resolveWorkshopOrderProductId(item.product_name);
  }

  if (item.product_id === customPotProductId) {
    return customPotProductId;
  }

  return item.product_id;
}
