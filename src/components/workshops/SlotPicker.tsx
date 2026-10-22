import { cn } from "@/lib/utils";
import type { WorkshopSessionAvailability } from "@/hooks/useWorkshopSessions";

type SlotPickerProps = {
  slots: string[];
  selected: string | null;
  onSelect: (slot: string) => void;
  label?: string;
  compact?: boolean;
  availabilityBySlot?: Record<string, WorkshopSessionAvailability>;
  seatsPerBooking?: number;
  coupleSlot?: boolean;
};

export const SlotPicker = ({
  slots,
  selected,
  onSelect,
  label = "Choose a Time Slot",
  compact = false,
  availabilityBySlot = {},
  seatsPerBooking = 1,
  coupleSlot = false,
}: SlotPickerProps) => (
  <div className="space-y-2 animate-in fade-in slide-in-from-bottom-2 duration-300">
    <p className="text-xs font-sans font-medium text-muted-foreground">{label}</p>
    <div className={cn("gap-2", compact ? "flex flex-col" : "flex flex-wrap gap-3")}>
      {slots.map((slot) => {
        const isSelected = selected === slot;
        const availability = availabilityBySlot[slot];
        const remaining = availability?.remaining ?? 0;
        const bookableUnits = Math.floor(remaining / Math.max(seatsPerBooking, 1));
        const isFull = availability ? bookableUnits <= 0 || !availability.isActive : false;

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
            {availability && (
              <span className={cn("block text-xs mt-0.5", isSelected ? "text-white/80" : "text-muted-foreground")}>
                {isFull
                  ? "Full"
                  : coupleSlot
                    ? "1 couple left"
                    : `${bookableUnits} spot${bookableUnits === 1 ? "" : "s"} left`}
              </span>
            )}
          </button>
        );
      })}
    </div>
  </div>
);
