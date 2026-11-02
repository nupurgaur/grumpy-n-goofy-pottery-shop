type WorkshopScheduleId =
  | "paint-your-own-pot"
  | "handbuilding-ceramics"
  | "wheel-throwing"
  | "date-night"
  | "private-clay-parties";

export type WorkshopParticipantRecord = {
  name: string;
  age: number;
};

export type WorkshopAddOnRecord = {
  id: string;
  label: string;
  price: number;
};

export type WorkshopBookingRecord = {
  scheduleId: WorkshopScheduleId;
  sessionDate: string;
  slot: string;
  participants: WorkshopParticipantRecord[];
  addOns?: WorkshopAddOnRecord[];
};

export function getWorkshopAddonTotal(
  booking?: { addOns?: WorkshopAddOnRecord[] | null } | null,
): number {
  return (booking?.addOns ?? []).reduce((sum, addon) => sum + Number(addon.price ?? 0), 0);
}

export function getMinAgeForWorkshop(scheduleId: WorkshopScheduleId): number {
  return scheduleId === "date-night" ? 20 : 12;
}

export function getRequiredParticipantCount(
  scheduleId: WorkshopScheduleId,
  quantity: number,
): number {
  return scheduleId === "date-night" ? quantity * 2 : quantity;
}

export function validateWorkshopBookingPolicy(
  scheduleId: WorkshopScheduleId,
  quantity: number,
  sessionDate: string,
): string | null {
  if (scheduleId === "date-night" && quantity !== 1) {
    return "Date Night is limited to one couple per time slot.";
  }

  if (
    scheduleId === "paint-your-own-pot" ||
    scheduleId === "handbuilding-ceramics" ||
    scheduleId === "wheel-throwing"
  ) {
    if (quantity < 1 || quantity > 4) {
      return "One-time experiences can be booked for up to 4 people. For a larger group, book a private clay party.";
    }
  }

  if (scheduleId === "private-clay-parties" && (quantity < 5 || quantity > 10)) {
    return "Private clay parties are for 5 to 10 people.";
  }

  if (!/^\d{4}-\d{2}-\d{2}$/.test(sessionDate)) {
    return "Choose a valid workshop date.";
  }

  const today = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());

  if (sessionDate <= today) {
    return "Workshops must be booked at least one day in advance.";
  }

  const [year, month, day] = sessionDate.split("-").map(Number);
  const weekday = new Date(Date.UTC(year, month - 1, day)).getUTCDay();
  if (weekday === 1 || weekday === 2) {
    return "The studio is closed on Monday and Tuesday.";
  }

  return null;
}

export function validateWorkshopBooking(
  scheduleId: WorkshopScheduleId,
  quantity: number,
  participants: WorkshopParticipantRecord[] | undefined,
): string | null {
  const required = getRequiredParticipantCount(scheduleId, quantity);
  const list = participants ?? [];

  if (list.length !== required) {
    return `Add details for all ${required} participant${required === 1 ? "" : "s"}.`;
  }

  const minAge = getMinAgeForWorkshop(scheduleId);

  for (let index = 0; index < list.length; index += 1) {
    const participant = list[index];
    const name = String(participant.name ?? "").trim();
    const age = Number(participant.age);

    if (!name) {
      return `Participant ${index + 1}: name is required.`;
    }

    if (!Number.isInteger(age) || age < 0 || age > 120) {
      return `Participant ${index + 1}: enter a valid age.`;
    }

    if (age < minAge) {
      return scheduleId === "date-night"
        ? `Participant ${index + 1}: Date Night participants must be at least ${minAge} years old.`
        : `Participant ${index + 1}: must be at least ${minAge} years old for this workshop.`;
    }
  }

  return null;
}
