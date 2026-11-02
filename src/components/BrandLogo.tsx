import { Link } from "react-router-dom";
import { BRAND_LOGO_ICON, BRAND_TITLE, BRAND_TITLE_STACKED } from "@/config/brand";
import { typography } from "@/config/typography";
import { cn } from "@/lib/utils";

type BrandLogoProps = {
  className?: string;
  iconClassName?: string;
  titleClassName?: string;
  /** Light text for dark backgrounds (e.g. footer) */
  variant?: "default" | "light";
  /** Stacked GOOFY / n / GRUMPY (header style) */
  titleLayout?: "inline" | "stacked";
  asLink?: boolean;
};

export const BrandLogo = ({
  className,
  iconClassName,
  titleClassName,
  variant = "default",
  titleLayout = "inline",
  asLink = false,
}: BrandLogoProps) => {
  const titleColor =
    variant === "light" ? "text-primary-foreground" : "text-brand-primary";

  const titleContent =
    titleLayout === "stacked" ? (
      <span
        className={cn(
          typography.title,
          "flex flex-col leading-[0.95] tracking-wide",
          titleColor,
          titleClassName,
        )}
        aria-label={BRAND_TITLE}
      >
        {BRAND_TITLE_STACKED.map((line, index) => (
          <span
            key={line}
            className={cn(
              index === 1 && "italic font-normal normal-case text-[0.72em] -my-0.5",
            )}
          >
            {line}
          </span>
        ))}
      </span>
    ) : (
      <span
        className={cn(
          typography.title,
          "leading-tight whitespace-nowrap",
          titleColor,
          titleClassName,
        )}
      >
        {BRAND_TITLE}
      </span>
    );

  const content = (
    <>
      <img
        src={BRAND_LOGO_ICON}
        alt=""
        aria-hidden
        className={cn("h-16 w-auto object-contain shrink-0", iconClassName)}
      />
      {titleContent}
    </>
  );

  const wrapperClass = cn("flex items-center gap-3 sm:gap-4 min-w-0", className);

  if (asLink) {
    return (
      <Link to="/" className={cn(wrapperClass, "hover:opacity-90 transition-opacity")}>
        {content}
      </Link>
    );
  }

  return <div className={wrapperClass}>{content}</div>;
};
