import { useEffect } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { FOOD_WINE_ADDON, formatWorkshopPrice } from "@/config/workshops";
import type { WorkshopScheduleId } from "@/lib/workshopSchedule";
import { getSlotsForWorkshop } from "@/lib/workshopSchedule";
import { BookingSummaryCard } from "./BookingSummaryCard";
import { SlotPicker } from "./SlotPicker";
import { WorkshopCalendar } from "./WorkshopCalendar";
import { WorkshopTicketQuantity } from "./WorkshopTicketQuantity";
import { useWorkshopSessionAvailability } from "@/hooks/useWorkshopSessions";
import { getRequiredParticipantCount } from "@/lib/workshopParticipants";
import { getWorkshopTicketLimits } from "@/config/workshops";
import { Wine } from "lucide-react";

type WorkshopBookingPanelProps = {
  scheduleId: WorkshopScheduleId;
  workshopTitle: string;
  unitPrice: number;
  unitPriceLabel: string;
  quantityLabel: string;
  unitLabel: string;
  ctaLabel: string;
  selectedDate?: Date;
  onDateSelect: (date: Date | undefined) => void;
  selectedSlot: string | null;
  onSlotSelect: (slot: string) => void;
  quantity: number;
  onQuantityChange: (value: number) => void;
  onBook: () => void;
  booking?: boolean;
  minQuantity?: number;
  maxQuantity?: number;
  foodWineSelected?: boolean;
  onFoodWineChange?: (selected: boolean) => void;
};

export const WorkshopBookingPanel = ({
  scheduleId,
  workshopTitle,
  unitPrice,
  unitPriceLabel,
  quantityLabel,
  unitLabel,
  ctaLabel,
  selectedDate,
  onDateSelect,
  selectedSlot,
  onSlotSelect,
  quantity,
  onQuantityChange,
  onBook,
  booking = false,
  minQuantity,
  maxQuantity,
  foodWineSelected,
  onFoodWineChange,
}: WorkshopBookingPanelProps) => {
  const limits = getWorkshopTicketLimits(scheduleId);
  const minTickets = minQuantity ?? limits.min;
  const slots = selectedDate ? getSlotsForWorkshop(scheduleId, selectedDate) : [];
  const { availabilityBySlot } = useWorkshopSessionAvailability(scheduleId, selectedDate);
  const selectedAvailability = selectedSlot ? availabilityBySlot[selectedSlot] : undefined;
  const seatsPerUnit = scheduleId === "date-night" ? 2 : 1;
  const configuredMax = maxQuantity ?? limits.max;
  const maxByCapacity = selectedAvailability
    ? Math.floor(selectedAvailability.remaining / seatsPerUnit)
    : null;
  const maxTickets =
    maxByCapacity == null
      ? configuredMax
      : Math.min(configuredMax, Math.max(maxByCapacity, 0));
  const belowMinCapacity =
    Boolean(selectedDate && selectedSlot) &&
    maxTickets > 0 &&
    maxTickets < minTickets;
  const showQuantityPicker =
    maxTickets > 0 && !belowMinCapacity && minTickets !== maxTickets;
  const addonTotal = foodWineSelected ? FOOD_WINE_ADDON.price : 0;
  const totalPrice = unitPrice * quantity + addonTotal;
  const canBook = Boolean(
    selectedDate &&
    selectedSlot &&
    quantity >= minTickets &&
    selectedAvailability &&
    selectedAvailability.isActive &&
    getRequiredParticipantCount(scheduleId, quantity) <= selectedAvailability.remaining,
  );

  useEffect(() => {
    if (maxTickets <= 0) return;
    if (quantity > maxTickets) {
      onQuantityChange(maxTickets);
    } else if (quantity < minTickets) {
      onQuantityChange(Math.min(minTickets, maxTickets));
    }
  }, [maxTickets, minTickets, onQuantityChange, quantity]);

  useEffect(() => {
    if (slots.length === 1) {
      onSlotSelect(slots[0]);
    }
  }, [slots, onSlotSelect]);

  return (
    <div className="space-y-4">
      <WorkshopCalendar
        scheduleId={scheduleId}
        selected={selectedDate}
        onSelect={onDateSelect}
      />

      {selectedDate && slots.length > 0 && (
        <SlotPicker
          slots={slots}
          selected={selectedSlot}
          onSelect={onSlotSelect}
          label="Choose a Time Slot"
          compact
          availabilityBySlot={availabilityBySlot}
          seatsPerBooking={seatsPerUnit}
          coupleSlot={scheduleId === "date-night"}
        />
      )}

      {selectedDate && selectedSlot && maxTickets === 0 && (
        <p className="text-sm text-destructive">
          This session is full. Please choose another date or time.
        </p>
      )}

      {belowMinCapacity && (
        <p className="text-sm text-destructive">
          This session doesn&apos;t have enough remaining spots for a group of{" "}
          {minTickets}. Please choose another date or time.
        </p>
      )}

      {selectedDate && scheduleId === "date-night" && slots.length > 0 && (
        <p className="text-xs text-muted-foreground font-sans">
          Each time slot can be booked by one couple only.
        </p>
      )}

      {selectedDate && selectedSlot && maxTickets > 0 && !belowMinCapacity && showQuantityPicker && (
        <WorkshopTicketQuantity
          value={quantity}
          onChange={onQuantityChange}
          label={quantityLabel}
          unitLabel={unitLabel}
          compact
          min={minTickets}
          max={maxTickets}
        />
      )}

      {selectedDate && selectedSlot && maxTickets > 0 && !belowMinCapacity && onFoodWineChange && (
        <label className="flex items-start gap-3 rounded-xl border border-border/50 bg-muted/30 px-4 py-3 cursor-pointer">
          <Checkbox
            checked={Boolean(foodWineSelected)}
            onCheckedChange={(checked) => onFoodWineChange(checked === true)}
            className="mt-0.5"
          />
          <span className="space-y-0.5">
            <span className="flex items-center gap-1.5 text-sm font-sans font-medium text-brand-primary">
              <Wine className="h-4 w-4 text-brand-secondary" />
              Add {FOOD_WINE_ADDON.label}
            </span>
            <span className="block text-xs text-muted-foreground font-sans">
              Optional pairing for your session · {formatWorkshopPrice(FOOD_WINE_ADDON.price)}
            </span>
          </span>
        </label>
      )}

      {canBook && selectedDate && selectedSlot && (
        <BookingSummaryCard
          workshopType={workshopTitle}
          date={selectedDate}
          slot={selectedSlot}
          quantity={quantity}
          quantityLabel={quantityLabel}
          unitPriceLabel={unitPriceLabel}
          totalPriceLabel={formatWorkshopPrice(totalPrice)}
          addonLabel={foodWineSelected ? FOOD_WINE_ADDON.label : undefined}
          addonPriceLabel={
            foodWineSelected ? formatWorkshopPrice(FOOD_WINE_ADDON.price) : undefined
          }
          ctaLabel={ctaLabel}
          onBook={onBook}
          booking={booking}
        />
      )}
    </div>
  );
};
