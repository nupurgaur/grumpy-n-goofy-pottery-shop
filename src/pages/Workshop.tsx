import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { CoursesSection } from "@/components/workshops/CoursesSection";
import { DateNightExperience } from "@/components/workshops/DateNightExperience";
import { OneTimeExperiences } from "@/components/workshops/OneTimeExperiences";
import { PrivateClayPartyExperience } from "@/components/workshops/PrivateClayPartyExperience";
import { WorkshopPageIntro } from "@/components/workshops/WorkshopPageIntro";
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

const PRIMARY_WORKSHOP_TABS: WorkshopTopTab[] = [
  "one-time",
  "date-night",
  "private-parties",
];

const WorkshopPage = () => {
  const { tabs, loading } = useWorkshopCatalog();
  const [searchParams] = useSearchParams();
  const tabParam = searchParams.get("tab") as WorkshopTopTab | null;
  const [activeTab, setActiveTab] = useState<WorkshopTopTab | null>(null);

  const primaryTabs = tabs.filter((tab) =>
    PRIMARY_WORKSHOP_TABS.includes(tab.id),
  );
  const secondaryTabs = tabs.filter(
    (tab) => !PRIMARY_WORKSHOP_TABS.includes(tab.id),
  );

  useEffect(() => {
    if (tabParam && tabs.some((tab) => tab.id === tabParam)) {
      setActiveTab(tabParam);
    }
  }, [tabParam, tabs]);

  useEffect(() => {
    if (!activeTab && tabs.length > 0) {
      const preferred =
        tabs.find((tab) => tab.id === "one-time") ?? tabs[0];
      setActiveTab(preferred.id);
    }
  }, [activeTab, tabs]);

  const renderTabButton = (tab: (typeof tabs)[number], compact?: boolean) => {
    const Icon = TAB_ICONS[tab.id] ?? Sparkles;
    const isActive = activeTab === tab.id;
    return (
      <button
        key={tab.id}
        type="button"
        onClick={() => setActiveTab(tab.id)}
        className={cn(
          "rounded-xl border-2 text-left transition-smooth focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-secondary/50",
          compact
            ? "p-4 min-h-[6.75rem] sm:min-h-[7.25rem]"
            : "p-5 sm:p-6 min-h-[9.5rem] sm:min-h-[10.5rem]",
          isActive
            ? "border-[#0D2B52] bg-[#FCE8EE] shadow-card"
            : "border-border/50 bg-card hover:border-[#0D2B52]/25 hover:bg-[#FCE8EE]/30",
        )}
      >
        <Icon
          className={cn(
            "mb-2 sm:mb-3 transition-colors",
            compact ? "h-5 w-5 sm:h-6 sm:w-6" : "h-7 w-7 mb-4",
            isActive ? "text-brand-secondary" : "text-brand-primary/50",
          )}
        />
        <p
          className={cn(
            "font-sans font-semibold mb-1 sm:mb-2 leading-snug",
            compact ? "text-sm sm:text-base" : "text-base sm:text-lg",
            isActive ? "text-[#0D2B52]" : "text-brand-primary",
          )}
        >
          {tab.label}
        </p>
        <p className="text-xs text-muted-foreground font-sans leading-snug line-clamp-2">
          {tab.tagline}
        </p>
      </button>
    );
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main>
        <section className="pt-6 sm:pt-8 pb-12 sm:pb-16 lg:pb-20">
          <div className="container mx-auto px-4 sm:px-6 max-w-5xl">
            <WorkshopPageIntro />

            {loading ? (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 mb-8">
                {[1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className="h-28 sm:h-[7.25rem] rounded-xl bg-muted animate-pulse"
                  />
                ))}
              </div>
            ) : tabs.length === 0 ? (
              <p className="text-center text-muted-foreground font-sans">
                Workshop experiences are being updated — please check back soon.
              </p>
            ) : (
              <>
                <div
                  className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 mb-6 sm:mb-8"
                  role="tablist"
                  aria-label="Workshop experience types"
                >
                  {primaryTabs.map((tab) => renderTabButton(tab, true))}
                </div>

                {secondaryTabs.length > 0 && (
                  <div className="grid sm:grid-cols-2 gap-3 sm:gap-4 mb-8 max-w-md sm:max-w-none">
                    {secondaryTabs.map((tab) => renderTabButton(tab))}
                  </div>
                )}

                {activeTab && (
                  <div className="transition-smooth animate-in fade-in slide-in-from-bottom-2 duration-300">
                    {activeTab === "one-time" && <OneTimeExperiences />}
                    {activeTab === "date-night" && <DateNightExperience />}
                    {activeTab === "private-parties" && (
                      <PrivateClayPartyExperience />
                    )}
                    {activeTab === "courses" && <CoursesSection />}
                  </div>
                )}
              </>
            )}
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default WorkshopPage;
