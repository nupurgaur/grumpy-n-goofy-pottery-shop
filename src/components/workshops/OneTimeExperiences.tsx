import { useEffect, useState } from "react";
import { typography } from "@/config/typography";
import { useWorkshopCatalog } from "@/hooks/useWorkshopCatalog";
import type { OneTimeExperienceId } from "@/config/workshops";
import { cn } from "@/lib/utils";
import { Brush, Hand, RotateCw } from "lucide-react";
import { OneTimeExperienceSection } from "./OneTimeExperienceSection";
import { WorkshopGroupDisclaimer } from "./WorkshopGroupDisclaimer";

const EXPERIENCE_ICONS: Record<OneTimeExperienceId, typeof Brush> = {
  "paint-your-own-pot": Brush,
  "handbuilding-ceramics": Hand,
  "wheel-throwing": RotateCw,
};

export const OneTimeExperiences = () => {
  const { oneTimeExperiences, loading, tabs } = useWorkshopCatalog();
  const oneTimeTab = tabs.find((tab) => tab.id === "one-time");
  const [experienceId, setExperienceId] = useState<OneTimeExperienceId | null>(null);

  useEffect(() => {
    if (oneTimeExperiences.length === 1) {
      setExperienceId(oneTimeExperiences[0].id);
    }
  }, [oneTimeExperiences]);

  const experience = experienceId
    ? oneTimeExperiences.find((e) => e.id === experienceId)
    : null;

  if (loading) {
    return <div className="h-48 rounded-xl bg-muted animate-pulse" />;
  }

  if (oneTimeExperiences.length === 0) {
    return (
      <p className="text-sm text-muted-foreground font-sans">
        One-time experiences are not available right now.
      </p>
    );
  }

  return (
    <div className="space-y-8">
      <div className="space-y-4">
        <h2 className={`text-2xl text-brand-primary ${typography.heading}`}>
          {oneTimeTab?.label ?? "One-Time Experiences"}
        </h2>
        {(oneTimeTab?.tagline || oneTimeExperiences.length > 1) && (
          <p className="text-sm font-sans text-muted-foreground">
            {oneTimeTab?.tagline ||
              "Choose an experience to see details and book your spot."}
          </p>
        )}
        <div className={cn(
          "grid gap-4",
          oneTimeExperiences.length === 1 ? "sm:grid-cols-1 max-w-md" : "sm:grid-cols-3",
        )}>
          {oneTimeExperiences.map((item) => {
            const Icon = EXPERIENCE_ICONS[item.id] ?? Brush;
            const isSelected = experienceId === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setExperienceId(item.id)}
                className={cn(
                  "rounded-xl border-2 p-5 sm:p-6 text-left transition-smooth focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-secondary/50 min-h-[8.5rem]",
                  isSelected
                    ? "border-[#0D2B52] bg-[#FCE8EE] shadow-card"
                    : "border-border/50 bg-card hover:border-[#0D2B52]/30",
                )}
              >
                <Icon
                  className={cn(
                    "h-6 w-6 mb-3",
                    isSelected ? "text-brand-secondary" : "text-brand-primary/60",
                  )}
                />
                <p
                  className={`text-sm sm:text-base text-brand-primary mb-2 ${typography.heading}`}
                >
                  {item.title}
                </p>
                <p className="text-xs sm:text-sm text-muted-foreground font-sans leading-relaxed">
                  {item.tagline}
                </p>
              </button>
            );
          })}
        </div>
      </div>

      {experience && (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
          <OneTimeExperienceSection experience={experience} />
          <WorkshopGroupDisclaimer />
        </div>
      )}
    </div>
  );
};
