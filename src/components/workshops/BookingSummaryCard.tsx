import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { typography } from "@/config/typography";
import { format } from "date-fns";
import { CalendarCheck } from "lucide-react";

type BookingSummaryCardProps = {
  workshopType: string;
  date: Date;
  slot: string;
  quantity: number;
  quantityLabel: string;
  unitPriceLabel: string;
  totalPriceLabel: string;
  addonLabel?: string;
  addonPriceLabel?: string;
  contactNote?: string;
  ctaLabel: string;
  onBook: () => void;
  booking?: boolean;
  submitDisabled?: boolean;
};

export const BookingSummaryCard = ({
  workshopType,
  date,
  slot,
  quantity,
  quantityLabel,
  unitPriceLabel,
  totalPriceLabel,
  addonLabel,
  addonPriceLabel,
  contactNote,
  ctaLabel,
  onBook,
  booking = false,
  submitDisabled = false,
}: BookingSummaryCardProps) => (
  <Card className="border border-border/50 shadow-card bg-card animate-in fade-in slide-in-from-bottom-2 duration-300">
    <CardContent className="p-4 sm:p-5 space-y-4">
      <div className="flex items-center gap-2 text-brand-primary">
        <CalendarCheck className="h-5 w-5 text-brand-secondary shrink-0" />
        <h3 className={`text-base ${typography.heading}`}>Booking Summary</h3>
      </div>

      <dl className="grid gap-3 font-sans text-sm">
        <div className="flex justify-between gap-4 border-b border-border/40 pb-3">
          <dt className="text-muted-foreground">Workshop Type</dt>
          <dd className="font-medium text-brand-primary text-right">{workshopType}</dd>
        </div>
        <div className="flex justify-between gap-4 border-b border-border/40 pb-3">
          <dt className="text-muted-foreground">Selected Date</dt>
          <dd className="font-medium text-brand-primary text-right">
            {format(date, "EEEE, MMMM d, yyyy")}
          </dd>
        </div>
        <div className="flex justify-between gap-4 border-b border-border/40 pb-3">
          <dt className="text-muted-foreground">Selected Slot</dt>
          <dd className="font-medium text-brand-primary text-right">{slot}</dd>
        </div>
        <div className="flex justify-between gap-4 border-b border-border/40 pb-3">
          <dt className="text-muted-foreground">{quantityLabel}</dt>
          <dd className="font-medium text-brand-primary text-right">{quantity}</dd>
        </div>
        <div className="flex justify-between gap-4 border-b border-border/40 pb-3">
          <dt className="text-muted-foreground">Price per ticket</dt>
          <dd className="font-medium text-brand-primary text-right">{unitPriceLabel}</dd>
        </div>
        {addonLabel && addonPriceLabel && (
          <div className="flex justify-between gap-4 border-b border-border/40 pb-3">
            <dt className="text-muted-foreground">{addonLabel}</dt>
            <dd className="font-medium text-brand-primary text-right">{addonPriceLabel}</dd>
          </div>
        )}
        {contactNote && (
          <div className="flex justify-between gap-4 border-b border-border/40 pb-3">
            <dt className="text-muted-foreground">Food &amp; beverages</dt>
            <dd className="font-medium text-brand-primary text-right text-xs sm:text-sm max-w-[14rem]">
              {contactNote}
            </dd>
          </div>
        )}
        <div className="flex justify-between gap-4">
          <dt className="text-muted-foreground">Total</dt>
          <dd className="font-semibold text-brand-primary text-right">{totalPriceLabel}</dd>
        </div>
      </dl>

      <Button
        variant="quirky"
        size="lg"
        className="w-full"
        onClick={onBook}
        disabled={booking || submitDisabled}
      >
        {booking ? "Adding to cart…" : ctaLabel}
      </Button>
    </CardContent>
  </Card>
);
