import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import { ProductImageCarousel } from "@/components/ProductImageCarousel";
import { typography } from "@/config/typography";
import {
  HOME_SECTION_CAROUSEL_CLASS,
  HOME_SECTION_CAROUSEL_WIDTH_CLASS,
  homeSectionClasses,
  type HomeSectionTone,
} from "@/config/homeSections";
import { WORKSHOP_CAROUSEL_IMAGES } from "@/config/workshopCarousel";

const HomeWorkshopsSection = ({
  sectionTone = "light-blue",
}: {
  sectionTone?: HomeSectionTone;
}) => {
  return (
    <section
      id="workshops"
      className={homeSectionClasses(sectionTone, "scroll-mt-28")}
    >
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 w-full">
        <div className="grid lg:grid-cols-5 gap-10 lg:gap-14 xl:gap-16 items-center">
          <div className="relative order-2 lg:order-1 lg:col-span-3 lg:justify-self-start lg:mr-16 xl:mr-24">
            <div
              className={`relative ${HOME_SECTION_CAROUSEL_WIDTH_CLASS} flex-shrink-0 overflow-hidden rounded-2xl shadow-quirky hover:scale-105 transition-smooth`}
            >
              <ProductImageCarousel
                images={WORKSHOP_CAROUSEL_IMAGES}
                alt="Pottery workshop at Goofy n Grumpy studio"
                className={HOME_SECTION_CAROUSEL_CLASS}
                showArrows={true}
                showDots={true}
                autoPlay={true}
                autoPlayInterval={4000}
                showCounter={false}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-primary/20 to-transparent pointer-events-none" />
            </div>
          </div>

          <div className="min-w-0 space-y-7 lg:space-y-8 lg:col-span-2 order-1 lg:order-2">
            <div className="space-y-5 max-w-xl lg:max-w-none lg:ml-auto">
              <h2
                className={`text-3xl sm:text-4xl lg:text-[2.5rem] xl:text-5xl leading-[1.15] tracking-tight ${typography.sectionHeader}`}
              >
                <span className="text-brand-primary">Workshops</span>{" "}
                <span className="text-brand-primary">&amp;</span>{" "}
                <span className="text-brand-secondary">Creative Experiences</span>
              </h2>
              <p className="text-base sm:text-lg leading-[1.65] text-foreground/80 font-sans">
                Try clay for an afternoon, plan a date night, or book a private
                party for birthdays, kitty gatherings, and bridal showers.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 pt-1 lg:justify-end">
              <Button asChild variant="quirky" size="lg" className="group">
                <Link to="/workshop">
                  Explore Workshops
                  <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HomeWorkshopsSection;
