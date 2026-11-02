import { addDays, format } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import type { WorkshopScheduleId } from "@/lib/workshopSchedule";
import {
  getSlotsForWorkshop,
  getWorkshopBookingMinDate,
  isDateAllowedForWorkshop,
} from "@/lib/workshopSchedule";

export async function generateUpcomingWorkshopSessions(
  scheduleIds: WorkshopScheduleId[],
  daysAhead = 90,
) {
  const start = getWorkshopBookingMinDate();
  const tasks: Promise<unknown>[] = [];

  for (let offset = 0; offset <= daysAhead; offset += 1) {
    const date = addDays(start, offset);

    for (const scheduleId of scheduleIds) {
      if (!isDateAllowedForWorkshop(scheduleId, date)) continue;

      for (const slot of getSlotsForWorkshop(scheduleId, date)) {
        tasks.push(
          supabase.rpc("ensure_workshop_session", {
            p_schedule_id: scheduleId,
            p_session_date: format(date, "yyyy-MM-dd"),
            p_slot: slot,
          }),
        );
      }
    }
  }

  await Promise.all(tasks);
}
