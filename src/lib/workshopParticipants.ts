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

export function getWorkshopBookingMeta(item: {
  product_name: string;
  quantity: number;
  workshop_booking?: WorkshopBookingMeta | null;
}): WorkshopBookingMeta | null {
  if (item.workshop_booking?.scheduleId && item.workshop_booking.sessionDate) {
    return item.workshop_booking;
  }

  const parsed = parseWorkshopCartName(item.product_name);
  if (!parsed) return null;

  const scheduleId = resolveScheduleIdFromTitle(parsed.title);
  if (!scheduleId) return null;

  return {
    scheduleId,
    sessionDate: parsed.sessionDate,
    slot: parsed.slot,
    participants: item.workshop_booking?.participants,
    addOns: item.workshop_booking?.addOns,
  };
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
