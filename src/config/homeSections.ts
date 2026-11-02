import { cn } from "@/lib/utils";

/** Home page section backgrounds — alternate between these two only */
export const HOME_SECTION_OFF_WHITE = "#F5F3EF";
export const HOME_SECTION_LIGHT_BLUE = "#E8F1F8";

export type HomeSectionTone = "off-white" | "light-blue";

const TONE_BG: Record<HomeSectionTone, string> = {
  "off-white": "bg-[#F5F3EF]",
  "light-blue": "bg-[#E8F1F8]",
};

/** Carousel height shared by hero + workshops home sections */
export const HOME_SECTION_CAROUSEL_CLASS =
  "w-full h-[340px] sm:h-[420px] lg:h-[500px]";

/** Max width for side-by-side home carousels */
export const HOME_SECTION_CAROUSEL_WIDTH_CLASS =
  "w-full max-w-[92vw] lg:w-[520px] xl:w-[580px]";

/** Shared min-height + vertical centering for every home section */
export const homeSectionClasses = (
  tone: HomeSectionTone,
  extra?: string,
) =>
  cn(
    TONE_BG[tone],
    "min-h-[520px] sm:min-h-[560px] flex flex-col justify-center py-12 sm:py-14",
    extra,
  );
