import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { typography } from "@/config/typography";
import type { OneTimeExperience } from "@/config/workshops";
import { useAuth } from "@/hooks/useAuth";
import { useCart } from "@/hooks/useCart";
import { Clock, IndianRupee } from "lucide-react";
import { WorkshopBookingPanel } from "./WorkshopBookingPanel";
import { WorkshopPhotoSlot } from "./WorkshopPhotoSlot";

type OneTimeExperienceSectionProps = {
  experience: OneTimeExperience;
};

export const OneTimeExperienceSection = ({
  experience,
}: OneTimeExperienceSectionProps) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { addWorkshopBooking } = useCart();
  const [selectedDate, setSelectedDate] = useState<Date | undefined>();
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [booking, setBooking] = useState(false);

  const handleDateSelect = (date: Date | undefined) => {
    setSelectedDate(date);
    setSelectedSlot(null);
  };

  const handleBook = async () => {
    if (!selectedDate || !selectedSlot) return;

    if (!user) {
      navigate("/auth", { state: { from: "/workshop" } });
      return;
    }

    setBooking(true);
    try {
      const added = await addWorkshopBooking({
        scheduleId: experience.id,
        title: experience.title,
        date: selectedDate,
        slot: selectedSlot,
        unitPrice: experience.price,
        quantity,
        image: experience.imageUrl,
        ticketLabel: `${quantity} ${quantity === 1 ? "person" : "people"}`,
      });
      if (added) {
        setSelectedDate(undefined);
        setSelectedSlot(null);
        setQuantity(1);
      }
    } finally {
      setBooking(false);
    }
  };

  return (
    <section className="grid lg:grid-cols-2 gap-6 lg:gap-8 items-start">
      <div className="h-[14rem] sm:h-[18rem] lg:h-[22rem] shrink-0 overflow-hidden rounded-xl border border-border/50 shadow-card">
        <WorkshopPhotoSlot
          imageUrl={experience.imageUrl}
          alt={`${experience.title} workshop`}
          className="h-full w-full rounded-none border-0 shadow-none"
          aspectClass="h-full w-full object-cover object-center"
        />
      </div>

      <div className="space-y-5">
        <Card className="border border-border/50 shadow-card">
          <CardContent className="p-5 sm:p-6 space-y-4">
            <div>
              <h3 className={`text-xl text-brand-primary mb-2 ${typography.heading}`}>
                {experience.title}
              </h3>
              <p className="text-sm text-brand-secondary/90 font-sans font-medium mb-2">
                {experience.tagline}
              </p>
              <p className="text-muted-foreground font-sans leading-relaxed text-sm sm:text-base">
                {experience.description}
              </p>
            </div>

            <div className="flex flex-wrap gap-4 sm:gap-6">
              <div className="flex items-center gap-2 text-sm font-sans">
                <Clock className="h-4 w-4 text-brand-secondary shrink-0" />
                <span className="text-muted-foreground">Duration:</span>
                <span className="font-medium text-brand-primary">
                  {experience.duration}
                </span>
              </div>
              <div className="flex items-center gap-2 text-sm font-sans">
                <IndianRupee className="h-4 w-4 text-brand-secondary shrink-0" />
                <span className="text-muted-foreground">Price:</span>
                <span className="font-medium text-brand-primary">
                  {experience.priceLabel}
                </span>
              </div>
            </div>

            {experience.additionalNote && (
              <p className="text-sm text-muted-foreground font-sans italic border-l-2 border-brand-secondary/40 pl-4">
                {experience.additionalNote}
              </p>
            )}
          </CardContent>
        </Card>

        <WorkshopBookingPanel
          scheduleId={experience.id}
          workshopTitle={experience.title}
          unitPrice={experience.price}
          unitPriceLabel={experience.priceLabel}
          quantityLabel="Number of People"
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
        />
      </div>
    </section>
  );
};
