import { useCallback, useEffect, useState } from "react";
import { addDays, format, startOfDay } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import type { WorkshopScheduleId } from "@/lib/workshopSchedule";
import { getSlotsForWorkshop } from "@/lib/workshopSchedule";
import { fetchWorkshopSessionAvailability } from "@/lib/workshopSessionAvailability";

export type WorkshopSessionAvailability = {
  sessionId: string;
  scheduleId: WorkshopScheduleId;
  sessionDate: string;
  slot: string;
  capacity: number;
  booked: number;
  remaining: number;
  isActive: boolean;
};

export type WorkshopSessionTimeFilter = "1d" | "1w" | "2w" | "1m" | "3m" | "all";
export type WorkshopSessionTypeFilter = "all" | WorkshopScheduleId;

export function getWorkshopSessionDateRange(filter: WorkshopSessionTimeFilter): {
  from: string;
  to: string | null;
} {
  const today = startOfDay(new Date());

  switch (filter) {
    case "1d":
      return { from: format(today, "yyyy-MM-dd"), to: format(today, "yyyy-MM-dd") };
    case "1w":
      return { from: format(today, "yyyy-MM-dd"), to: format(addDays(today, 7), "yyyy-MM-dd") };
    case "2w":
      return { from: format(today, "yyyy-MM-dd"), to: format(addDays(today, 14), "yyyy-MM-dd") };
    case "1m":
      return { from: format(today, "yyyy-MM-dd"), to: format(addDays(today, 30), "yyyy-MM-dd") };
    case "3m":
      return { from: format(today, "yyyy-MM-dd"), to: format(addDays(today, 90), "yyyy-MM-dd") };
    case "all":
    default:
      return { from: format(today, "yyyy-MM-dd"), to: null };
  }
}

export function useWorkshopSessionAvailability(
  scheduleId: WorkshopScheduleId,
  sessionDate?: Date,
) {
  const [availabilityBySlot, setAvailabilityBySlot] = useState<
    Record<string, WorkshopSessionAvailability>
  >({});
  const [loading, setLoading] = useState(false);

  const refresh = useCallback(async () => {
    if (!sessionDate) {
      setAvailabilityBySlot({});
      return;
    }

    const slots = getSlotsForWorkshop(scheduleId, sessionDate);
    if (slots.length === 0) {
      setAvailabilityBySlot({});
      return;
    }

    setLoading(true);
    try {
      const dateStr = format(sessionDate, "yyyy-MM-dd");
      const results = await Promise.all(
        slots.map(async (slot) => {
          const row = await fetchWorkshopSessionAvailability(scheduleId, dateStr, slot);
          return {
            sessionId: row.sessionId ?? "",
            scheduleId,
            sessionDate: dateStr,
            slot,
            capacity: row.capacity,
            booked: row.booked,
            remaining: row.remaining,
            isActive: row.isActive,
          } satisfies WorkshopSessionAvailability;
        }),
      );

      const next: Record<string, WorkshopSessionAvailability> = {};
      for (const entry of results) {
        if (entry) next[entry.slot] = entry;
      }
      setAvailabilityBySlot(next);
    } catch (error) {
      console.error("Error loading workshop availability:", error);
      setAvailabilityBySlot({});
    } finally {
      setLoading(false);
    }
  }, [scheduleId, sessionDate]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { availabilityBySlot, loading, refresh };
}

export function useWorkshopSessionAdminList(
  timeFilter: WorkshopSessionTimeFilter = "3m",
  typeFilter: WorkshopSessionTypeFilter = "all",
) {
  const [sessions, setSessions] = useState<WorkshopSessionAvailability[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      await supabase.rpc("sync_workshop_sessions_from_orders");

      const { from, to } = getWorkshopSessionDateRange(timeFilter);

      let query = supabase
        .from("workshop_sessions")
        .select("*")
        .gte("session_date", from)
        .order("session_date", { ascending: true })
        .order("slot", { ascending: true });

      if (to) {
        query = query.lte("session_date", to);
      }

      if (typeFilter !== "all") {
        query = query.eq("schedule_id", typeFilter);
      }

      const { data, error } = await query;

      if (error) throw error;

      const enriched = await Promise.all(
        (data ?? []).map(async (session) => {
          const row = await fetchWorkshopSessionAvailability(
            session.schedule_id as WorkshopScheduleId,
            session.session_date,
            session.slot,
          );

          return {
            sessionId: session.id,
            scheduleId: session.schedule_id as WorkshopScheduleId,
            sessionDate: session.session_date,
            slot: session.slot,
            capacity: row.capacity,
            booked: row.booked,
            remaining: row.remaining,
            isActive: row.isActive,
          } satisfies WorkshopSessionAvailability;
        }),
      );

      setSessions(enriched);
    } catch (error) {
      console.error("Error loading admin workshop sessions:", error);
      setSessions([]);
    } finally {
      setLoading(false);
    }
  }, [timeFilter, typeFilter]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { sessions, loading, refresh };
}
