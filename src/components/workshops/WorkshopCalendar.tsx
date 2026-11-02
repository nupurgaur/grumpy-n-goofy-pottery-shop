import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { WORKSHOP_SCHEDULE_NOTE } from "@/config/workshops";
import {
  getWorkshopBookingMinDate,
  isWorkshopDateDisabled,
  type WorkshopScheduleId,
} from "@/lib/workshopSchedule";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { CalendarDays, ChevronDown } from "lucide-react";

const calendarClassNames = {
  months: "flex flex-col",
  month: "space-y-3",
  caption: "flex justify-center pt-1 relative items-center",
  caption_label: "font-sans font-semibold text-brand-primary text-sm",
  nav: "space-x-1 flex items-center",
  nav_button: "h-7 w-7 bg-transparent p-0 opacity-60 hover:opacity-100 border rounded-md",
  nav_button_previous: "absolute left-1",
  nav_button_next: "absolute right-1",
  table: "w-full border-collapse",
  head_row: "flex w-full",
  head_cell:
    "text-muted-foreground w-9 font-sans text-[0.7rem] font-normal flex items-center justify-center",
  row: "flex w-full mt-1",
  cell: "h-9 w-9 text-center text-sm p-0 relative flex items-center justify-center",
  day: "h-8 w-8 p-0 font-sans font-normal rounded-md hover:bg-[#FCE8EE]/60",
  day_selected:
    "bg-[#0D2B52] text-white hover:bg-[#0D2B52] hover:text-white focus:bg-[#0D2B52] focus:text-white",
  day_today: "bg-[#FCE8EE] text-[#0D2B52] font-semibold",
  day_disabled: "text-muted-foreground/40 opacity-40",
  day_outside: "text-muted-foreground/30 opacity-40",
};

type WorkshopCalendarProps = {
  scheduleId: WorkshopScheduleId;
  selected?: Date;
  onSelect: (date: Date | undefined) => void;
  className?: string;
};

export const WorkshopCalendar = ({
  scheduleId,
  selected,
  onSelect,
  className,
}: WorkshopCalendarProps) => {
  const [open, setOpen] = useState(false);

  const handleSelect = (date: Date | undefined) => {
    onSelect(date);
    if (date) setOpen(false);
  };

  return (
    <div className={cn("relative", className)}>
      <Button
        type="button"
        variant="outline"
        onClick={() => setOpen((prev) => !prev)}
        className={cn(
          "w-full justify-between font-sans h-10 rounded-xl border-primary/20",
          (open || selected) && "border-[#0D2B52]/40 bg-[#FCE8EE]/30",
        )}
      >
        <span className="flex items-center gap-2 min-w-0">
          <CalendarDays className="h-4 w-4 text-brand-secondary shrink-0" />
          <span className="truncate text-sm">
            {selected
              ? format(selected, "EEE, MMM d, yyyy")
              : "Choose a Date"}
          </span>
        </span>
        <ChevronDown
          className={cn(
            "h-4 w-4 shrink-0 transition-transform duration-200",
            open && "rotate-180",
          )}
        />
      </Button>

      {open && (
        <div className="absolute z-30 top-full left-0 right-0 mt-2 animate-in fade-in slide-in-from-top-2 duration-200 rounded-xl border border-border/50 bg-card p-3 shadow-card">
          <Calendar
            mode="single"
            selected={selected}
            onSelect={handleSelect}
            disabled={(date) => isWorkshopDateDisabled(scheduleId, date)}
            defaultMonth={selected ?? getWorkshopBookingMinDate()}
            fromDate={getWorkshopBookingMinDate()}
            className="pointer-events-auto mx-auto p-0"
            classNames={calendarClassNames}
          />
          <p className="text-[0.65rem] text-muted-foreground font-sans text-center px-1 pt-2">
            {WORKSHOP_SCHEDULE_NOTE} · book at least one day in advance
          </p>
        </div>
      )}
    </div>
  );
};
