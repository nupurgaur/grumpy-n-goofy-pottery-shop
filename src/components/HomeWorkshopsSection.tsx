import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { typography } from "@/config/typography";
import { homeSectionClasses, type HomeSectionTone } from "@/config/homeSections";
import { useWorkshopCatalog } from "@/hooks/useWorkshopCatalog";
import { cn } from "@/lib/utils";
import {
  CalendarHeart,
  GraduationCap,
  PartyPopper,
  Sparkles,
} from "lucide-react";
import type { WorkshopTopTab } from "@/config/workshops";

const TAB_ICONS: Record<WorkshopTopTab, typeof Sparkles> = {
  "one-time": Sparkles,
  "date-night": CalendarHeart,
  "private-parties": PartyPopper,
  courses: GraduationCap,
};

const HomeWorkshopsSection = ({
  sectionTone = "light-blue",
}: {
  sectionTone?: HomeSectionTone;
}) => {
  const { tabs, loading } = useWorkshopCatalog();

  return (
    <section
      id="workshops"
      className={homeSectionClasses(sectionTone, "scroll-mt-28")}
    >
      <div className="container mx-auto px-4 sm:px-6 w-full">
        <div className="text-center mb-10 sm:mb-12 max-w-3xl mx-auto space-y-4">
          <h2
            className={`text-3xl lg:text-4xl text-brand-primary ${typography.sectionHeader}`}
          >
            Workshops &amp; Creative Experiences
          </h2>
          <p className="text-base sm:text-lg text-muted-foreground font-sans leading-relaxed">
            Try clay for an afternoon, plan a date night, or book a private
            party for birthdays, kitty gatherings, and bridal showers.
          </p>
        </div>

        {loading ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-40 rounded-xl bg-white/50 animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
            {tabs.map((tab) => {
              const Icon = TAB_ICONS[tab.id] ?? Sparkles;
              return (
                <Link
                  key={tab.id}
                  to={`/workshop?tab=${tab.id}`}
                  className={cn(
                    "rounded-xl border-2 border-border/50 bg-white/70 p-5 sm:p-6 text-left transition-smooth hover:border-[#0D2B52]/30 hover:bg-[#FCE8EE]/40 min-h-[9.5rem]",
                  )}
                >
                  <Icon className="h-6 w-6 mb-3 text-brand-primary/60" />
                  <p className={`text-base text-brand-primary mb-2 ${typography.heading}`}>
                    {tab.label}
                  </p>
                  <p className="text-xs sm:text-sm text-muted-foreground font-sans leading-relaxed">
                    {tab.tagline}
                  </p>
                </Link>
              );
            })}
          </div>
        )}

        <div className="text-center">
          <Button asChild variant="quirky" size="lg">
            <Link to="/workshop">Book a Workshop</Link>
          </Button>
        </div>
      </div>
    </section>
  );
};

export default HomeWorkshopsSection;
