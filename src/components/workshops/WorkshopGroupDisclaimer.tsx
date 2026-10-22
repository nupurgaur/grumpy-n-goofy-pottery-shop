import { Link } from "react-router-dom";
import { GROUP_BOOKING_THRESHOLD } from "@/config/workshops";
import { Info } from "lucide-react";

export const WorkshopGroupDisclaimer = () => (
  <div className="flex items-start gap-3 rounded-xl border border-border/50 bg-muted/30 px-4 py-3">
    <Info className="h-4 w-4 text-brand-secondary shrink-0 mt-0.5" />
    <p className="text-xs sm:text-sm text-muted-foreground font-sans leading-relaxed">
      Booking for a group of more than {GROUP_BOOKING_THRESHOLD} people?{" "}
      <Link
        to="/workshop?tab=private-parties"
        className="font-medium text-brand-primary underline-offset-4 hover:underline hover:text-brand-secondary transition-colors"
      >
        Book a private clay party
      </Link>{" "}
      for kitty parties, birthdays, and bridal showers (5–10 guests).
    </p>
  </div>
);
