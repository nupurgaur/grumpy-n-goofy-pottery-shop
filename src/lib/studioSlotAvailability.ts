import {
  MAX_PRIVATE_PARTY_TICKETS,
  STUDIO_ONE_TIME_SLOT_CAPACITY,
} from "@/config/workshops";
import type { WorkshopScheduleId } from "@/lib/workshopSchedule";
import {
  isExclusiveWorkshopSchedule,
  isOneTimeWorkshopSchedule,
} from "@/lib/workshopParticipants";
import type { WorkshopAvailabilityRow } from "@/lib/workshopSessionAvailability";

/** Guest seats available when an exclusive slot is open (0 when taken or blocked). */
export function exclusiveOpenSlotSeats(
  scheduleId: WorkshopScheduleId,
  row: WorkshopAvailabilityRow,
): number {
  if (!row.isActive || row.booked > 0) return 0;
  if (scheduleId === "date-night") return 2;
  if (scheduleId === "private-clay-parties") {
    const cap = row.capacity > 0 ? row.capacity : MAX_PRIVATE_PARTY_TICKETS;
    return Math.min(cap, MAX_PRIVATE_PARTY_TICKETS);
  }
  return 0;
}

export type StudioSlotMetrics = {
  oneTimeUsed: number;
  hasExclusiveBooking: boolean;
  isAdminBlocked: boolean;
};

export function applyStudioSlotRules(
  scheduleId: WorkshopScheduleId,
  row: WorkshopAvailabilityRow,
  metrics: StudioSlotMetrics,
): WorkshopAvailabilityRow {
  const { oneTimeUsed, hasExclusiveBooking, isAdminBlocked } = metrics;

  if (isAdminBlocked || hasExclusiveBooking) {
    return {
      ...row,
      remaining: 0,
      isActive: false,
    };
  }

  if (isExclusiveWorkshopSchedule(scheduleId)) {
    if (oneTimeUsed >= 1) {
      return {
        ...row,
        remaining: 0,
        isActive: row.isActive,
      };
    }
    const seats = exclusiveOpenSlotSeats(scheduleId, row);
    const capacity =
      scheduleId === "date-night"
        ? 2
        : Math.min(
            row.capacity > 0 ? row.capacity : MAX_PRIVATE_PARTY_TICKETS,
            MAX_PRIVATE_PARTY_TICKETS,
          );
    return {
      ...row,
      capacity,
      remaining: seats,
    };
  }

  if (isOneTimeWorkshopSchedule(scheduleId)) {
    const capacity = STUDIO_ONE_TIME_SLOT_CAPACITY;
    const remaining = row.isActive ? Math.max(capacity - oneTimeUsed, 0) : 0;
    return {
      ...row,
      capacity,
      remaining,
    };
  }

  return row;
}
