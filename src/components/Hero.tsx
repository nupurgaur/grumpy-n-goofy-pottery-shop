import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import { HERO_CAROUSEL_IMAGES } from "@/config/heroCarousel";
import { typography } from "@/config/typography";
import { ProductImageCarousel } from "@/components/ProductImageCarousel";
import {
  HOME_SECTION_CAROUSEL_CLASS,
  HOME_SECTION_CAROUSEL_WIDTH_CLASS,
  homeSectionClasses,
  type HomeSectionTone,
} from "@/config/homeSections";

const BRAND_PILLARS = [
  { title: "PLAYFUL", description: "Collect expressive ceramics" },
  { title: "CREATE", description: "Join beginner-friendly workshops" },
  { title: "CONNECT", description: "Become part of a growing clay community" },
] as const;

const Hero = ({ sectionTone = "off-white" }: { sectionTone?: HomeSectionTone }) => {
  return (
    <section
      id="home"
      className={homeSectionClasses(sectionTone, "relative overflow-hidden scroll-mt-28")}
    >
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 w-full">
        <div className="grid lg:grid-cols-5 gap-10 lg:gap-14 xl:gap-16 items-center">
          {/* Content */}
          <div className="min-w-0 space-y-7 lg:space-y-8 lg:col-span-2">
            <div className="space-y-5 max-w-xl">
              <h1
                className={`text-4xl sm:text-5xl lg:text-[3.25rem] xl:text-6xl leading-[1.15] tracking-tight ${typography.title}`}
              >
                <span className="text-brand-primary">Making</span>{" "}
                <span className="text-brand-secondary">Pottery</span>{" "}
                <span className="text-brand-primary">Feel Less Intimidating.</span>
              </h1>

              <p className="text-base sm:text-lg leading-[1.65] text-foreground/80 font-sans max-w-md">
                From collectible ceramics to playful workshops, Goofy n Grumpy
                is a creative space for curious people and everyday rituals.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 pt-1">
              <Button asChild variant="quirky" size="lg" className="group">
                <a href="/?category=all#shop">
                  Explore Ceramics
                  <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                </a>
              </Button>
            </div>

            <div
              className="mt-8 lg:mt-10 grid w-full min-w-0 grid-cols-1 sm:grid-cols-3"
              aria-label="Brand pillars"
            >
              {BRAND_PILLARS.map((pillar, index) => (
                <div
                  key={pillar.title}
                  className={`flex min-w-0 flex-col items-start text-left py-7 sm:py-2 sm:pr-3 lg:pr-4 ${
                    index > 0
                      ? "border-t sm:border-t-0 sm:border-l border-[#E5E5E5] sm:pl-4 lg:pl-5"
                      : "sm:pr-4"
                  }`}
                >
                  <p className="font-title font-bold text-sm sm:text-[0.9375rem] uppercase tracking-[0.14em] text-[#0D2B52]">
                    {pillar.title}
                  </p>
                  <p className="w-full min-w-0 font-sans text-xs sm:text-sm text-[#2E2E2E] mt-2.5 leading-snug break-words">
                    {pillar.description}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Hero Image Carousel */}
          <div className="relative lg:col-span-3 lg:justify-self-end lg:ml-16 xl:ml-24">
            <div
              className={`relative ${HOME_SECTION_CAROUSEL_WIDTH_CLASS} flex-shrink-0 overflow-hidden rounded-2xl shadow-quirky hover:scale-105 transition-smooth`}
            >
              <div className="pointer-events-none absolute inset-0 z-0 bg-gradient-to-t from-primary/20 to-transparent" />
              <ProductImageCarousel
                images={HERO_CAROUSEL_IMAGES}
                alt="Beautiful handcrafted pottery collection"
                className={`relative z-[1] ${HOME_SECTION_CAROUSEL_CLASS}`}
                showArrows={true}
                alwaysShowArrows={true}
                showDots={true}
                autoPlay={true}
                autoPlayInterval={4000}
                showCounter={false}
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
