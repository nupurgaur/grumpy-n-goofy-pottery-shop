import { cn } from "@/lib/utils";

/** Home page section backgrounds — alternate between these two only */
export const HOME_SECTION_OFF_WHITE = "#F5F3EF";
export const HOME_SECTION_LIGHT_BLUE = "#E8F1F8";

export type HomeSectionTone = "off-white" | "light-blue";

const TONE_BG: Record<HomeSectionTone, string> = {
  "off-white": "bg-[#F5F3EF]",
  "light-blue": "bg-[#E8F1F8]",
};

/** Shared min-height + vertical centering for every home section */
export const homeSectionClasses = (
  tone: HomeSectionTone,
  extra?: string,
) =>
  cn(
    TONE_BG[tone],
    "min-h-[640px] sm:min-h-[680px] flex flex-col justify-center py-16 sm:py-20",
    extra,
  );
