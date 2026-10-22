import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { CoursesSection } from "@/components/workshops/CoursesSection";
import { DateNightExperience } from "@/components/workshops/DateNightExperience";
import { OneTimeExperiences } from "@/components/workshops/OneTimeExperiences";
import { PrivateClayPartyExperience } from "@/components/workshops/PrivateClayPartyExperience";
import { useWorkshopCatalog } from "@/hooks/useWorkshopCatalog";
import { typography } from "@/config/typography";
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

const WorkshopPage = () => {
  const { tabs, loading } = useWorkshopCatalog();
  const [searchParams] = useSearchParams();
  const tabParam = searchParams.get("tab") as WorkshopTopTab | null;
  const [activeTab, setActiveTab] = useState<WorkshopTopTab | null>(null);

  useEffect(() => {
    if (tabParam && tabs.some((tab) => tab.id === tabParam)) {
      setActiveTab(tabParam);
    }
  }, [tabParam, tabs]);

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main>
        <section className="py-12 sm:py-16 lg:py-20">
          <div className="container mx-auto px-4 sm:px-6 max-w-5xl">
            <div className="space-y-4 mb-10 lg:mb-12 text-center max-w-3xl mx-auto">
              <h1
                className={`text-3xl sm:text-4xl lg:text-5xl text-brand-primary leading-tight ${typography.title}`}
              >
                Workshops &amp;{" "}
                <span className="text-brand-secondary">Creative Experiences</span>
              </h1>
              <p className="text-base sm:text-lg text-muted-foreground font-sans leading-relaxed">
                Whether you&apos;re trying clay for the first time, planning a
                unique date, or looking to build a creative hobby, our workshops
                are designed to make pottery feel welcoming and fun.
              </p>
            </div>

            {loading ? (
              <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="h-36 rounded-xl bg-muted animate-pulse" />
                ))}
              </div>
            ) : tabs.length === 0 ? (
              <p className="text-center text-muted-foreground font-sans">
                Workshop experiences are being updated — please check back soon.
              </p>
            ) : (
              <>
                <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-10 lg:mb-12">
                  {tabs.map((tab) => {
                    const Icon = TAB_ICONS[tab.id] ?? Sparkles;
                    const isActive = activeTab === tab.id;
                    return (
                      <button
                        key={tab.id}
                        type="button"
                        onClick={() => setActiveTab(tab.id)}
                        className={cn(
                          "rounded-xl border-2 p-5 sm:p-6 text-left transition-smooth focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-secondary/50 min-h-[9.5rem] sm:min-h-[10.5rem]",
                          isActive
                            ? "border-[#0D2B52] bg-[#FCE8EE] shadow-card"
                            : "border-border/50 bg-card hover:border-[#0D2B52]/25 hover:bg-[#FCE8EE]/30",
                        )}
                      >
                        <Icon
                          className={cn(
                            "h-7 w-7 mb-4 transition-colors",
                            isActive ? "text-brand-secondary" : "text-brand-primary/50",
                          )}
                        />
                        <p
                          className={cn(
                            "font-sans font-semibold text-base sm:text-lg mb-2",
                            isActive ? "text-[#0D2B52]" : "text-brand-primary",
                          )}
                        >
                          {tab.label}
                        </p>
                        <p className="text-xs sm:text-sm text-muted-foreground font-sans leading-relaxed">
                          {tab.tagline}
                        </p>
                      </button>
                    );
                  })}
                </div>

                {activeTab && (
                  <div className="transition-smooth animate-in fade-in slide-in-from-bottom-2 duration-300">
                    {activeTab === "one-time" && <OneTimeExperiences />}
                    {activeTab === "date-night" && <DateNightExperience />}
                    {activeTab === "private-parties" && <PrivateClayPartyExperience />}
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
