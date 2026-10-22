import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { typography } from "@/config/typography";
import {
  FOOD_WINE_ADDON,
  MIN_PRIVATE_PARTY_TICKETS,
  MAX_PRIVATE_PARTY_TICKETS,
} from "@/config/workshops";
import { useAuth } from "@/hooks/useAuth";
import { useCart } from "@/hooks/useCart";
import { useWorkshopCatalog } from "@/hooks/useWorkshopCatalog";
import { Clock, IndianRupee, PartyPopper, Sparkles, Users } from "lucide-react";
import { WorkshopBookingPanel } from "./WorkshopBookingPanel";
import { WorkshopPhotoSlot } from "./WorkshopPhotoSlot";

export const PrivateClayPartyExperience = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { addWorkshopBooking } = useCart();
  const { privateParty, loading } = useWorkshopCatalog();
  const [selectedDate, setSelectedDate] = useState<Date | undefined>();
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const [quantity, setQuantity] = useState(MIN_PRIVATE_PARTY_TICKETS);
  const [booking, setBooking] = useState(false);
  const [includeFoodWine, setIncludeFoodWine] = useState(false);

  const handleDateSelect = (date: Date | undefined) => {
    setSelectedDate(date);
    setSelectedSlot(null);
  };

  const handleBook = async () => {
    if (!selectedDate || !selectedSlot || !privateParty) return;

    if (!user) {
      navigate("/auth", { state: { from: "/workshop" } });
      return;
    }

    setBooking(true);
    try {
      const added = await addWorkshopBooking({
        scheduleId: "private-clay-parties",
        title: privateParty.title,
        date: selectedDate,
        slot: selectedSlot,
        unitPrice: privateParty.price,
        quantity,
        image: privateParty.imageUrl,
        ticketLabel: `${quantity} ${quantity === 1 ? "guest" : "guests"}`,
        addOns: includeFoodWine ? [{ ...FOOD_WINE_ADDON }] : [],
      });
      if (added) {
        setSelectedDate(undefined);
        setSelectedSlot(null);
        setQuantity(MIN_PRIVATE_PARTY_TICKETS);
        setIncludeFoodWine(false);
      }
    } finally {
      setBooking(false);
    }
  };

  if (loading) {
    return <div className="h-64 rounded-xl bg-muted animate-pulse" />;
  }

  if (!privateParty) {
    return (
      <p className="text-sm text-muted-foreground font-sans">
        Private clay parties are not available right now.
      </p>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-300">
      <div className="space-y-2">
        <div className="flex items-center gap-3">
          <PartyPopper className="h-6 w-6 text-brand-secondary shrink-0" />
          <h2 className={`text-2xl sm:text-3xl text-brand-primary ${typography.heading}`}>
            {privateParty.title}
          </h2>
        </div>
        <p className="text-sm font-sans text-brand-secondary/90 font-medium">
          {privateParty.tagline}
        </p>
      </div>

      <div className="grid lg:grid-cols-2 gap-6 lg:gap-8 items-start">
        <div className="h-[14rem] sm:h-[18rem] lg:h-[22rem] shrink-0 overflow-hidden rounded-xl border border-border/50 shadow-card">
          <WorkshopPhotoSlot
            imageUrl={privateParty.imageUrl}
            alt="Private clay party"
            className="h-full w-full rounded-none border-0 shadow-none"
            aspectClass="h-full w-full object-cover object-center"
          />
        </div>

        <div className="space-y-5">
          <Card className="border border-border/50 shadow-card">
            <CardContent className="p-5 sm:p-6 space-y-5">
              <p className="text-muted-foreground font-sans leading-relaxed text-sm sm:text-base">
                {privateParty.description}
              </p>

              <div className="flex flex-wrap gap-4 sm:gap-6">
                <div className="flex items-center gap-2 text-sm font-sans">
                  <Clock className="h-4 w-4 text-brand-secondary shrink-0" />
                  <span className="text-muted-foreground">Duration:</span>
                  <span className="font-medium text-brand-primary">
                    {privateParty.duration}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-sm font-sans">
                  <IndianRupee className="h-4 w-4 text-brand-secondary shrink-0" />
                  <span className="text-muted-foreground">Price:</span>
                  <span className="font-medium text-brand-primary">
                    {privateParty.priceLabel}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-sm font-sans">
                  <Users className="h-4 w-4 text-brand-secondary shrink-0" />
                  <span className="text-muted-foreground">Group size:</span>
                  <span className="font-medium text-brand-primary">
                    {MIN_PRIVATE_PARTY_TICKETS}–{MAX_PRIVATE_PARTY_TICKETS} people
                  </span>
                </div>
              </div>

              {privateParty.includes.length > 0 && (
                <div>
                  <p className={`text-sm text-brand-primary mb-2 ${typography.heading}`}>
                    Includes
                  </p>
                  <ul className="space-y-2">
                    {privateParty.includes.map((item) => (
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

              {privateParty.additionalNote && (
                <p className="text-sm text-muted-foreground font-sans italic border-l-2 border-brand-secondary/40 pl-4">
                  {privateParty.additionalNote}
                </p>
              )}
            </CardContent>
          </Card>

          <WorkshopBookingPanel
            scheduleId="private-clay-parties"
            workshopTitle={privateParty.title}
            unitPrice={privateParty.price}
            unitPriceLabel={privateParty.priceLabel}
            quantityLabel="Group size"
            unitLabel="guests"
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
    </div>
  );
};
