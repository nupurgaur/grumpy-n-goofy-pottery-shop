import {
  STUDIO_OPEN_DATE,
  WORKSHOP_TIME_SLOTS,
  type WorkshopScheduleId,
} from "@/config/workshops";
import { addDays, format, getDay, isBefore, startOfDay } from "date-fns";

export type { WorkshopScheduleId };

const MON = 1;
const TUE = 2;
const STUDIO_TIME_ZONE = "Asia/Kolkata";

/** Calendar day in the studio timezone (matches Supabase availability rules). */
export const getStudioCalendarDate = (reference = new Date()): Date => {
  const ymd = new Intl.DateTimeFormat("en-CA", {
    timeZone: STUDIO_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(reference);
  const [year, month, day] = ymd.split("-").map(Number);
  return startOfDay(new Date(year, month - 1, day));
};

export const formatWorkshopSessionDate = (date: Date): string =>
  format(startOfDay(date), "yyyy-MM-dd");

export const getWorkshopBookingMinDate = (): Date => {
  const earliestBookable = addDays(getStudioCalendarDate(), 1);
  const studioOpen = startOfDay(STUDIO_OPEN_DATE);
  return isBefore(earliestBookable, studioOpen) ? studioOpen : earliestBookable;
};

export const isDateAllowedForWorkshop = (
  _scheduleId: WorkshopScheduleId,
  date: Date,
): boolean => {
  const day = startOfDay(date);
  if (isBefore(day, getWorkshopBookingMinDate())) return false;

  const dow = getDay(day);
  return dow !== MON && dow !== TUE;
};

export const getSlotsForWorkshop = (
  _scheduleId: WorkshopScheduleId,
  _date: Date,
): string[] => [...WORKSHOP_TIME_SLOTS];

export const isWorkshopDateDisabled = (
  scheduleId: WorkshopScheduleId,
  date: Date,
): boolean => !isDateAllowedForWorkshop(scheduleId, date);
