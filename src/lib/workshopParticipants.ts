import { format, parse } from "date-fns";
import type { WorkshopScheduleId } from "@/lib/workshopSchedule";

export type WorkshopParticipant = {
  name: string;
  age: string;
};

export type WorkshopAddOn = {
  id: string;
  label: string;
  price: number;
};

export type WorkshopBookingMeta = {
  scheduleId: WorkshopScheduleId;
  sessionDate: string;
  slot: string;
  participants?: WorkshopParticipant[];
  addOns?: WorkshopAddOn[];
  foodBeverageContactRequested?: boolean;
};

export function getWorkshopAddonTotal(
  booking?: { addOns?: WorkshopAddOn[] | null } | null,
): number {
  return (booking?.addOns ?? []).reduce((sum, addon) => sum + Number(addon.price ?? 0), 0);
}

export function getCartItemLineTotal(item: {
  product_price: number;
  quantity: number;
  workshop_booking?: { addOns?: WorkshopAddOn[] | null } | null;
}): number {
  return item.product_price * item.quantity + getWorkshopAddonTotal(item.workshop_booking);
}

const ONE_TIME_SCHEDULES: WorkshopScheduleId[] = [
  "paint-your-own-pot",
  "handbuilding-ceramics",
  "wheel-throwing",
];

const EXCLUSIVE_SCHEDULES: WorkshopScheduleId[] = ["date-night", "private-clay-parties"];

const WORKSHOP_SCHEDULE_SHORT_LABELS: Record<WorkshopScheduleId, string> = {
  "paint-your-own-pot": "a one-time workshop",
  "handbuilding-ceramics": "a one-time workshop",
  "wheel-throwing": "a one-time workshop",
  "date-night": "Date Night",
  "private-clay-parties": "a private clay party",
};

export function isOneTimeWorkshopSchedule(scheduleId: WorkshopScheduleId): boolean {
  return ONE_TIME_SCHEDULES.includes(scheduleId);
}

export function isExclusiveWorkshopSchedule(scheduleId: WorkshopScheduleId): boolean {
  return EXCLUSIVE_SCHEDULES.includes(scheduleId);
}

export function normalizeWorkshopSlot(slot: string): string {
  return slot.replace(/\u2013|\u2014/g, "–").replace(/\s+/g, " ").trim();
}

function workshopSlotKeysMatch(
  meta: WorkshopBookingMeta,
  incoming: { sessionDate: string; slot: string },
): boolean {
  const metaSlot = meta.slot?.trim();
  const incomingSlot = incoming.slot?.trim();
  if (!meta.sessionDate || !incoming.sessionDate || !metaSlot || !incomingSlot) {
    return false;
  }
  return (
    meta.sessionDate === incoming.sessionDate &&
    normalizeWorkshopSlot(metaSlot) === normalizeWorkshopSlot(incomingSlot)
  );
}

/** One-time vs date night / private (or two exclusives) cannot share the same date and time slot. */
export function workshopsConflictForSameSlot(
  existingScheduleId: WorkshopScheduleId,
  incomingScheduleId: WorkshopScheduleId,
): boolean {
  if (existingScheduleId === incomingScheduleId) return false;
  if (isExclusiveWorkshopSchedule(existingScheduleId) && isExclusiveWorkshopSchedule(incomingScheduleId)) {
    return true;
  }
  if (isExclusiveWorkshopSchedule(existingScheduleId) && isOneTimeWorkshopSchedule(incomingScheduleId)) {
    return true;
  }
  if (isOneTimeWorkshopSchedule(existingScheduleId) && isExclusiveWorkshopSchedule(incomingScheduleId)) {
    return true;
  }
  return false;
}

export function findCartWorkshopSlotConflict(
  items: Array<{
    product_name: string;
    quantity: number;
    workshop_booking?: WorkshopBookingMeta | null;
  }>,
  incoming: {
    scheduleId: WorkshopScheduleId;
    sessionDate: string;
    slot: string;
  },
): WorkshopScheduleId | null {
  for (const item of items) {
    const meta = getWorkshopBookingMeta(item);
    if (!meta) continue;
    if (!workshopSlotKeysMatch(meta, incoming)) continue;
    if (workshopsConflictForSameSlot(meta.scheduleId, incoming.scheduleId)) {
      return meta.scheduleId;
    }
  }
  return null;
}

/** Paid-order pool does not include cart lines; subtract these when validating new bookings. */
export function countOneTimeSeatsInCart(
  items: Array<{
    product_name: string;
    quantity: number;
    workshop_booking?: WorkshopBookingMeta | null;
  }>,
  sessionDate: string,
  slot: string,
): number {
  let total = 0;
  for (const item of items) {
    const meta = getWorkshopBookingMeta(item);
    if (!meta || !isOneTimeWorkshopSchedule(meta.scheduleId)) continue;
    if (!workshopSlotKeysMatch(meta, { sessionDate, slot })) continue;
    total += getRequiredParticipantCount(meta.scheduleId, item.quantity);
  }
  return total;
}

export function workshopSlotConflictMessage(
  cartScheduleId: WorkshopScheduleId,
  incomingScheduleId: WorkshopScheduleId,
): string {
  const inCart = WORKSHOP_SCHEDULE_SHORT_LABELS[cartScheduleId];
  const adding = WORKSHOP_SCHEDULE_SHORT_LABELS[incomingScheduleId];
  if (isOneTimeWorkshopSchedule(incomingScheduleId) && isExclusiveWorkshopSchedule(cartScheduleId)) {
    return `You already have ${inCart} in your cart for this time slot. Remove it before booking ${adding}.`;
  }
  if (isExclusiveWorkshopSchedule(incomingScheduleId) && isOneTimeWorkshopSchedule(cartScheduleId)) {
    return `You already have ${inCart} in your cart for this time slot. Remove it before booking ${adding}.`;
  }
  return `This time slot conflicts with ${inCart} already in your cart. Choose another slot or remove the other booking.`;
}

export function getMinAgeForWorkshop(scheduleId: WorkshopScheduleId): number {
  return scheduleId === "date-night" ? 20 : 12;
}

export function getRequiredParticipantCount(
  scheduleId: WorkshopScheduleId,
  quantity: number,
): number {
  if (scheduleId === "date-night") {
    return quantity * 2;
  }
  return quantity;
}

export function getParticipantUnitLabel(scheduleId: WorkshopScheduleId): string {
  return scheduleId === "date-night" ? "couple member" : "participant";
}

export function createEmptyParticipants(count: number): WorkshopParticipant[] {
  return Array.from({ length: count }, () => ({ name: "", age: "" }));
}

export function resizeParticipants(
  current: WorkshopParticipant[],
  targetCount: number,
): WorkshopParticipant[] {
  if (targetCount <= current.length) {
    return current.slice(0, targetCount);
  }
  return [
    ...current,
    ...createEmptyParticipants(targetCount - current.length),
  ];
}

export function parseWorkshopCartName(productName: string): {
  title: string;
  sessionDate: string;
  slot: string;
} | null {
  const match = productName.match(
    /^Workshop — (.+?) · ([A-Za-z]{3}, [A-Za-z]{3} \d{1,2}, \d{4}) · (.+)$/,
  );
  if (!match) return null;

  try {
    const parsedDate = parse(match[2], "EEE, MMM d, yyyy", new Date());
    return {
      title: match[1],
      sessionDate: format(parsedDate, "yyyy-MM-dd"),
      slot: match[3],
    };
  } catch {
    return null;
  }
}

export function resolveScheduleIdFromTitle(title: string): WorkshopScheduleId | null {
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

/** Resolve schedule + date + time slot from cart/order line (JSON and/or product name). */
export function buildWorkshopBookingMetaFromItem(item: {
  product_name: string;
  quantity: number;
  workshop_booking?: WorkshopBookingMeta | null;
}): WorkshopBookingMeta | null {
  const parsed = parseWorkshopCartName(item.product_name);
  const stored = item.workshop_booking;

  const scheduleId =
    (stored?.scheduleId as WorkshopScheduleId | undefined) ??
    (parsed ? resolveScheduleIdFromTitle(parsed.title) : null);
  const sessionDate = stored?.sessionDate ?? parsed?.sessionDate;
  const slot = stored?.slot?.trim() || parsed?.slot?.trim();

  if (!scheduleId || !sessionDate || !slot) return null;

  return {
    scheduleId,
    sessionDate,
    slot,
    participants: stored?.participants,
    addOns: stored?.addOns,
    foodBeverageContactRequested: stored?.foodBeverageContactRequested,
  };
}

export function getWorkshopBookingMeta(item: {
  product_name: string;
  quantity: number;
  workshop_booking?: WorkshopBookingMeta | null;
}): WorkshopBookingMeta | null {
  return buildWorkshopBookingMetaFromItem(item);
}

export function validateParticipant(
  participant: WorkshopParticipant,
  scheduleId: WorkshopScheduleId,
): string | null {
  const name = participant.name.trim();
  const ageRaw = participant.age.trim();

  if (!name) {
    return "Name is required";
  }

  if (!ageRaw) {
    return "Age is required";
  }

  const age = Number(ageRaw);
  if (!Number.isInteger(age) || age < 0 || age > 120) {
    return "Enter a valid age";
  }

  const minAge = getMinAgeForWorkshop(scheduleId);
  if (age < minAge) {
    if (scheduleId === "date-night") {
      return `Date Night participants must be at least ${minAge} years old`;
    }
    if (ONE_TIME_SCHEDULES.includes(scheduleId)) {
      return `Participants must be at least ${minAge} years old for this workshop`;
    }
    return `Minimum age is ${minAge}`;
  }

  return null;
}

export function validateWorkshopParticipants(
  scheduleId: WorkshopScheduleId,
  quantity: number,
  participants: WorkshopParticipant[],
): { valid: boolean; errors: string[] } {
  const required = getRequiredParticipantCount(scheduleId, quantity);
  const errors: string[] = [];

  if (participants.length !== required) {
    errors.push(`Add details for all ${required} participant${required === 1 ? "" : "s"}.`);
    return { valid: false, errors };
  }

  participants.forEach((participant, index) => {
    const error = validateParticipant(participant, scheduleId);
    if (error) {
      errors.push(`Participant ${index + 1}: ${error}`);
    }
  });

  return { valid: errors.length === 0, errors };
}

export function serializeParticipantsForOrder(
  participants: WorkshopParticipant[],
): Array<{ name: string; age: number }> {
  return participants.map((participant) => ({
    name: participant.name.trim(),
    age: Number(participant.age),
  }));
}
