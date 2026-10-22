import {
  STUDIO_OPEN_DATE,
  WORKSHOP_TIME_SLOTS,
  type WorkshopScheduleId,
} from "@/config/workshops";
import { addDays, getDay, isBefore, startOfDay } from "date-fns";

export type { WorkshopScheduleId };

const MON = 1;
const TUE = 2;

export const getWorkshopBookingMinDate = (): Date => {
  const earliestBookable = startOfDay(addDays(new Date(), 1));
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
