import { useCallback, useEffect, useState } from "react";
import { endOfMonth, format, startOfMonth } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import type { WorkshopScheduleId } from "@/lib/workshopSchedule";

export type StudioSlotCalendarRow = {
  sessionDate: string;
  slot: string;
  oneTimeUsed: number;
  oneTimeCapacity: number;
  hasExclusiveBooking: boolean;
  isBlocked: boolean;
  exclusiveLabel: string | null;
  notes: string | null;
};

export type WorkshopOfflineBooking = {
  id: string;
  sessionDate: string;
  slot: string;
  scheduleId: WorkshopScheduleId;
  seats: number;
  customerName: string | null;
  phone: string | null;
  notes: string | null;
};

type RpcCalendarRow = {
  session_date: string;
  slot: string;
  one_time_used: number;
  one_time_capacity: number;
  has_exclusive_booking: boolean;
  is_blocked: boolean;
  exclusive_label: string | null;
  notes: string | null;
};

function mapCalendarRow(row: RpcCalendarRow): StudioSlotCalendarRow {
  return {
    sessionDate: row.session_date,
    slot: row.slot,
    oneTimeUsed: row.one_time_used,
    oneTimeCapacity: row.one_time_capacity,
    hasExclusiveBooking: row.has_exclusive_booking,
    isBlocked: row.is_blocked,
    exclusiveLabel: row.exclusive_label,
    notes: row.notes,
  };
}

export function useStudioCalendarMonth(month: Date) {
  const [rows, setRows] = useState<StudioSlotCalendarRow[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const from = format(startOfMonth(month), "yyyy-MM-dd");
      const to = format(endOfMonth(month), "yyyy-MM-dd");
      const { data, error } = await supabase.rpc("get_studio_slot_calendar_range", {
        p_from: from,
        p_to: to,
      });
      if (error) throw error;
      setRows((data as RpcCalendarRow[] | null)?.map(mapCalendarRow) ?? []);
    } catch (error) {
      console.error("Studio calendar load failed:", error);
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, [month]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { rows, loading, refresh };
}

export function useOfflineBookingsForDay(sessionDate: string | undefined) {
  const [bookings, setBookings] = useState<WorkshopOfflineBooking[]>([]);
  const [loading, setLoading] = useState(false);

  const refresh = useCallback(async () => {
    if (!sessionDate) {
      setBookings([]);
      return;
    }
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("workshop_offline_bookings")
        .select("*")
        .eq("session_date", sessionDate)
        .order("slot", { ascending: true });
      if (error) throw error;
      setBookings(
        (data ?? []).map((row) => ({
          id: row.id,
          sessionDate: row.session_date,
          slot: row.slot,
          scheduleId: row.schedule_id as WorkshopScheduleId,
          seats: row.seats,
          customerName: row.customer_name,
          phone: row.phone,
          notes: row.notes,
        })),
      );
    } catch (error) {
      console.error("Offline bookings load failed:", error);
      setBookings([]);
    } finally {
      setLoading(false);
    }
  }, [sessionDate]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { bookings, loading, refresh };
}
