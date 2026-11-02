import { cn } from "@/lib/utils";
import { STUDIO_ONE_TIME_SLOT_CAPACITY } from "@/config/workshops";
import type { WorkshopSessionAvailability } from "@/hooks/useWorkshopSessions";
import { isExclusiveWorkshopSchedule } from "@/lib/workshopParticipants";
import type { WorkshopScheduleId } from "@/lib/workshopSchedule";

type SlotPickerProps = {
  slots: string[];
  selected: string | null;
  onSelect: (slot: string) => void;
  label?: string;
  compact?: boolean;
  availabilityBySlot?: Record<string, WorkshopSessionAvailability>;
  seatsPerBooking?: number;
  cartBlockedSlots?: ReadonlySet<string>;
  /** Shared one-time pool: show seats left from paid orders (remaining on availability row). */
  showPoolSpotsLeft?: boolean;
  scheduleId?: WorkshopScheduleId;
};

export const SlotPicker = ({
  slots,
  selected,
  onSelect,
  label = "Choose a Time Slot",
  compact = false,
  availabilityBySlot = {},
  seatsPerBooking = 1,
  cartBlockedSlots,
  showPoolSpotsLeft = false,
  scheduleId,
}: SlotPickerProps) => (
  <div className="space-y-2 animate-in fade-in slide-in-from-bottom-2 duration-300">
    <p className="text-xs font-sans font-medium text-muted-foreground">{label}</p>
    <div className={cn("gap-2", compact ? "flex flex-col" : "flex flex-wrap gap-3")}>
      {slots.map((slot) => {
        const isSelected = selected === slot;
        const availability = availabilityBySlot[slot];
        const rawRemaining = availability?.remaining ?? 0;
        const remaining = showPoolSpotsLeft
          ? Math.min(rawRemaining, STUDIO_ONE_TIME_SLOT_CAPACITY)
          : rawRemaining;
        const bookableUnits =
          scheduleId && isExclusiveWorkshopSchedule(scheduleId)
            ? availability && availability.remaining > 0 && availability.isActive
              ? 1
              : 0
            : Math.floor(remaining / Math.max(seatsPerBooking, 1));
        const cartBlocked = cartBlockedSlots?.has(slot) ?? false;
        const isFull =
          cartBlocked || (availability ? bookableUnits <= 0 || !availability.isActive : false);

        return (
          <button
            key={slot}
            type="button"
            onClick={() => !isFull && onSelect(slot)}
            disabled={isFull}
            className={cn(
              "rounded-xl border-2 text-sm font-sans font-medium transition-smooth",
              compact ? "w-full px-4 py-2.5 text-left" : "px-5 py-3",
              isFull && "cursor-not-allowed opacity-50",
              isSelected
                ? "border-[#0D2B52] bg-[#0D2B52] text-white shadow-card"
                : "border-border/50 bg-background text-brand-primary hover:border-[#0D2B52]/30 hover:bg-[#FCE8EE]/40",
            )}
          >
            <span>{slot}</span>
            {(isFull || (showPoolSpotsLeft && availability && remaining > 0)) && (
              <span
                className={cn(
                  "block text-xs mt-0.5",
                  isSelected ? "text-white/80" : "text-muted-foreground",
                )}
              >
                {isFull
                  ? cartBlocked
                    ? "Unavailable"
                    : "Full"
                  : `${remaining} spot${remaining === 1 ? "" : "s"} left`}
              </span>
            )}
          </button>
        );
      })}
    </div>
  </div>
);
