import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { typography } from "@/config/typography";
import { useAuth } from "@/hooks/useAuth";
import { useCart } from "@/hooks/useCart";
import { useWorkshopCatalog } from "@/hooks/useWorkshopCatalog";
import { FOOD_WINE_ADDON } from "@/config/workshops";
import {
  Clock,
  Heart,
  IndianRupee,
  Sparkles,
} from "lucide-react";
import { WorkshopBookingPanel } from "./WorkshopBookingPanel";
import { WorkshopGroupDisclaimer } from "./WorkshopGroupDisclaimer";
import { WorkshopPhotoSlot } from "./WorkshopPhotoSlot";

export const DateNightExperience = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { addWorkshopBooking } = useCart();
  const { dateNight, loading } = useWorkshopCatalog();
  const [selectedDate, setSelectedDate] = useState<Date | undefined>();
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [booking, setBooking] = useState(false);
  const [includeFoodWine, setIncludeFoodWine] = useState(false);

  const handleDateSelect = (date: Date | undefined) => {
    setSelectedDate(date);
    setSelectedSlot(null);
  };

  const handleBook = async () => {
    if (!selectedDate || !selectedSlot || !dateNight) return;

    if (!user) {
      navigate("/auth", { state: { from: "/workshop" } });
      return;
    }

    setBooking(true);
    try {
      const added = await addWorkshopBooking({
        scheduleId: "date-night",
        title: dateNight.title,
        date: selectedDate,
        slot: selectedSlot,
        unitPrice: dateNight.price,
        quantity,
        image: dateNight.imageUrl,
        ticketLabel: `${quantity} ${quantity === 1 ? "couple" : "couples"}`,
        addOns: includeFoodWine ? [{ ...FOOD_WINE_ADDON }] : [],
      });
      if (added) {
        setSelectedDate(undefined);
        setSelectedSlot(null);
        setQuantity(1);
        setIncludeFoodWine(false);
      }
    } finally {
      setBooking(false);
    }
  };

  if (loading) {
    return <div className="h-64 rounded-xl bg-muted animate-pulse" />;
  }

  if (!dateNight) {
    return (
      <p className="text-sm text-muted-foreground font-sans">
        Date Night is not available right now.
      </p>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-300">
      <div className="space-y-2">
        <div className="flex items-center gap-3">
          <Heart className="h-6 w-6 text-brand-secondary shrink-0" />
          <h2 className={`text-2xl sm:text-3xl text-brand-primary ${typography.heading}`}>
            {dateNight.title}
          </h2>
        </div>
        <p className="text-sm font-sans text-brand-secondary/90 font-medium">
          {dateNight.tagline}
        </p>
      </div>

      <div className="grid lg:grid-cols-2 gap-6 lg:gap-8 items-start">
        <div className="h-[14rem] sm:h-[18rem] lg:h-[22rem] shrink-0 overflow-hidden rounded-xl border border-border/50 shadow-card">
          <WorkshopPhotoSlot
            imageUrl={dateNight.imageUrl}
            alt="Clay Date Night workshop"
            className="h-full w-full rounded-none border-0 shadow-none"
            aspectClass="h-full w-full object-cover object-center"
          />
        </div>

        <div className="space-y-5">
          <Card className="border border-border/50 shadow-card">
            <CardContent className="p-5 sm:p-6 space-y-5">
              <p className="text-muted-foreground font-sans leading-relaxed text-sm sm:text-base">
                {dateNight.description}
              </p>

              <div className="space-y-3">
                <div className="flex items-center gap-2 text-sm font-sans">
                  <Clock className="h-4 w-4 text-brand-secondary shrink-0" />
                  <span className="text-muted-foreground">Schedule:</span>
                  <span className="font-medium text-brand-primary">
                    {dateNight.time || "2 Hours"}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-sm font-sans">
                  <IndianRupee className="h-4 w-4 text-brand-secondary shrink-0" />
                  <span className="text-muted-foreground">Price:</span>
                  <span className="font-medium text-brand-primary">
                    {dateNight.priceLabel}
                  </span>
                </div>
              </div>

              {dateNight.includes.length > 0 && (
                <div>
                  <p className={`text-sm text-brand-primary mb-2 ${typography.heading}`}>
                    Includes
                  </p>
                  <ul className="space-y-2">
                    {dateNight.includes.map((item) => (
                      <li
                        key={item}
                        className="flex items-start gap-2 text-sm text-muted-foreground font-sans"
                      >
                        <Sparkles className="h-4 w-4 text-brand-secondary shrink-0 mt-0.5" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {dateNight.firingNote && (
                <p className="text-sm text-muted-foreground font-sans italic border-l-2 border-brand-secondary/40 pl-4">
                  {dateNight.firingNote}
                </p>
              )}

              {dateNight.messageCard && (
                <p className={`text-sm text-brand-primary leading-relaxed ${typography.heading}`}>
                  &ldquo;{dateNight.messageCard}&rdquo;
                </p>
              )}
            </CardContent>
          </Card>

          <WorkshopBookingPanel
            scheduleId="date-night"
            workshopTitle={dateNight.title}
            unitPrice={dateNight.price}
            unitPriceLabel={dateNight.priceLabel}
            quantityLabel="Number of Couples"
            unitLabel="tickets"
            ctaLabel="Add to Cart"
            selectedDate={selectedDate}
            onDateSelect={handleDateSelect}
            selectedSlot={selectedSlot}
            onSlotSelect={setSelectedSlot}
            quantity={quantity}
            onQuantityChange={setQuantity}
            onBook={handleBook}
            booking={booking}
            foodWineSelected={includeFoodWine}
            onFoodWineChange={setIncludeFoodWine}
          />
        </div>
      </div>

      <WorkshopGroupDisclaimer />
    </div>
  );
};
