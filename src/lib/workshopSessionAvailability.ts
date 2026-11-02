import { supabase } from "@/integrations/supabase/client";
import { getWorkshopTicketLimits, STUDIO_ONE_TIME_SLOT_CAPACITY } from "@/config/workshops";
import { isDateAllowedForWorkshop, type WorkshopScheduleId } from "@/lib/workshopSchedule";
import { applyStudioSlotRules, type StudioSlotMetrics } from "@/lib/studioSlotAvailability";
import { isOneTimeWorkshopSchedule } from "@/lib/workshopParticipants";
import { parseISO, startOfDay } from "date-fns";

export type WorkshopAvailabilityRow = {
  sessionId: string | null;
  capacity: number;
  booked: number;
  remaining: number;
  isActive: boolean;
};

type RpcAvailabilityRow = {
  session_id: string | null;
  capacity: number;
  booked: number;
  remaining: number;
  is_active: boolean;
};

type EnsuredSessionRow = {
  id: string;
  capacity: number;
  is_active: boolean;
};

const ONE_TIME_SCHEDULE_IDS: WorkshopScheduleId[] = [
  "paint-your-own-pot",
  "handbuilding-ceramics",
  "wheel-throwing",
];

const EXCLUSIVE_SCHEDULE_IDS: WorkshopScheduleId[] = ["date-night", "private-clay-parties"];

function isReadOnlyTransactionError(error: unknown): boolean {
  if (!error || typeof error !== "object" || !("message" in error)) return false;
  return String((error as { message: string }).message).includes("read-only transaction");
}

function parseRpcAvailability(data: unknown): WorkshopAvailabilityRow | null {
  const row = (Array.isArray(data) ? data[0] : data) as RpcAvailabilityRow | undefined;
  if (!row) return null;
  return {
    sessionId: row.session_id,
    capacity: row.capacity,
    booked: row.booked,
    remaining: row.remaining,
    isActive: row.is_active,
  };
}

function isMissingStudioRpcError(error: unknown): boolean {
  if (!error || typeof error !== "object" || !("message" in error)) return false;
  const message = String((error as { message: string }).message).toLowerCase();
  return (
    message.includes("count_studio_one_time_seats") ||
    message.includes("studio_slot_has_exclusive_booking") ||
    message.includes("studio_slot_is_admin_blocked") ||
    message.includes("could not find the function")
  );
}

async function countPaidBookings(
  scheduleId: WorkshopScheduleId,
  sessionDate: string,
  slot: string,
): Promise<number> {
  const { data, error } = await supabase.rpc("count_workshop_session_bookings", {
    p_schedule_id: scheduleId,
    p_session_date: sessionDate,
    p_slot: slot,
  });
  if (error) throw error;
  return Number(data ?? 0);
}

async function fetchStudioSlotMetricsFromBookings(
  sessionDate: string,
  slot: string,
): Promise<StudioSlotMetrics> {
  const oneTimeCounts = await Promise.all(
    ONE_TIME_SCHEDULE_IDS.map((scheduleId) =>
      countPaidBookings(scheduleId, sessionDate, slot),
    ),
  );
  const exclusiveCounts = await Promise.all(
    EXCLUSIVE_SCHEDULE_IDS.map((scheduleId) =>
      countPaidBookings(scheduleId, sessionDate, slot),
    ),
  );

  return {
    oneTimeUsed: oneTimeCounts.reduce((sum, count) => sum + count, 0),
    hasExclusiveBooking: exclusiveCounts.some((count) => count > 0),
    isAdminBlocked: false,
  };
}

async function fetchStudioSlotMetrics(
  sessionDate: string,
  slot: string,
): Promise<StudioSlotMetrics> {
  const [oneTimeRes, exclusiveRes, blockedRes] = await Promise.all([
    supabase.rpc("count_studio_one_time_seats", {
      p_session_date: sessionDate,
      p_slot: slot,
    }),
    supabase.rpc("studio_slot_has_exclusive_booking", {
      p_session_date: sessionDate,
      p_slot: slot,
    }),
    supabase.rpc("studio_slot_is_admin_blocked", {
      p_session_date: sessionDate,
      p_slot: slot,
    }),
  ]);

  const dedicatedRpcAvailable =
    !oneTimeRes.error ||
    isReadOnlyTransactionError(oneTimeRes.error) ||
    !isMissingStudioRpcError(oneTimeRes.error);

  if (dedicatedRpcAvailable && !oneTimeRes.error) {
    if (exclusiveRes.error && !isReadOnlyTransactionError(exclusiveRes.error)) {
      throw exclusiveRes.error;
    }
    if (blockedRes.error && !isReadOnlyTransactionError(blockedRes.error)) {
      throw blockedRes.error;
    }

    return {
      oneTimeUsed: Number(oneTimeRes.data ?? 0),
      hasExclusiveBooking: Boolean(exclusiveRes.data),
      isAdminBlocked: Boolean(blockedRes.data),
    };
  }

  const fromBookings = await fetchStudioSlotMetricsFromBookings(sessionDate, slot);

  if (!blockedRes.error) {
    return { ...fromBookings, isAdminBlocked: Boolean(blockedRes.data) };
  }

  return fromBookings;
}

function fallbackAvailabilityFromSession(
  scheduleId: WorkshopScheduleId,
  sessionDate: string,
  session: EnsuredSessionRow,
  booked: number,
): WorkshopAvailabilityRow {
  let capacity = session.capacity;
  if (isOneTimeWorkshopSchedule(scheduleId)) {
    capacity = STUDIO_ONE_TIME_SLOT_CAPACITY;
  } else if (scheduleId === "date-night") {
    capacity = Math.min(capacity, 2);
  }
  const date = startOfDay(parseISO(sessionDate));
  const isOpen = isDateAllowedForWorkshop(scheduleId, date) && session.is_active;
  const remaining = isOpen ? Math.max(capacity - booked, 0) : 0;
  return {
    sessionId: session.id,
    capacity,
    booked,
    remaining,
    isActive: isOpen,
  };
}

/** Ensures session row exists, then reads availability (read-only RPC safe). */
export async function fetchWorkshopSessionAvailability(
  scheduleId: WorkshopScheduleId,
  sessionDate: string,
  slot: string,
): Promise<WorkshopAvailabilityRow> {
  const { data: ensured, error: ensureError } = await supabase.rpc("ensure_workshop_session", {
    p_schedule_id: scheduleId,
    p_session_date: sessionDate,
    p_slot: slot,
  });

  if (ensureError) throw ensureError;

  const session = ensured as EnsuredSessionRow;

  const { data: availabilityData, error: availabilityError } = await supabase.rpc(
    "get_workshop_session_availability",
    {
      p_schedule_id: scheduleId,
      p_session_date: sessionDate,
      p_slot: slot,
    },
  );

  let availabilityRow: WorkshopAvailabilityRow | null = null;

  if (!availabilityError) {
    availabilityRow = parseRpcAvailability(availabilityData);
  }

  if (availabilityError && !isReadOnlyTransactionError(availabilityError)) {
    throw availabilityError;
  }

  const { data: bookedCount, error: countError } = await supabase.rpc(
    "count_workshop_session_bookings",
    {
      p_schedule_id: scheduleId,
      p_session_date: sessionDate,
      p_slot: slot,
    },
  );

  if (countError) throw countError;

  if (!availabilityRow) {
    availabilityRow = fallbackAvailabilityFromSession(
      scheduleId,
      sessionDate,
      session,
      Number(bookedCount ?? 0),
    );
  }

  const metrics = await fetchStudioSlotMetrics(sessionDate, slot);
  return applyStudioSlotRules(scheduleId, availabilityRow, metrics);
}

/** Seats still bookable in the shared one-time pool after paid orders (not including cart). */
export function getOneTimePoolRemaining(row: WorkshopAvailabilityRow): number {
  return Math.max(row.remaining, 0);
}

export function getBookableOneTimeSeats(
  poolRemaining: number,
  seatsAlreadyInCart: number,
): number {
  return Math.max(poolRemaining - seatsAlreadyInCart, 0);
}

export function getConfiguredWorkshopMaxSeats(scheduleId: WorkshopScheduleId): number {
  const limits = getWorkshopTicketLimits(scheduleId);
  if (scheduleId === "date-night") {
    return limits.max * 2;
  }
  return limits.max;
}
