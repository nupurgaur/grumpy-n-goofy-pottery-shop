import type { PatternId } from "@/config/potCustomizer";
import { buildPatternElement } from "@/lib/potPatternDefs";
import { cn } from "@/lib/utils";

interface PatternSwatchProps {
  patternId: PatternId;
  baseColor: string;
  accentColor: string;
  className?: string;
}

export const PatternSwatch = ({
  patternId,
  baseColor,
  accentColor,
  className,
}: PatternSwatchProps) => {
  const swatchId = `swatch-${patternId}-${baseColor}-${accentColor}`.replace(
    /[^a-zA-Z0-9-]/g,
    "",
  );

  return (
    <div
      className={cn(
        "w-full h-full rounded-md overflow-hidden border border-border/30",
        className,
      )}
      style={{ backgroundColor: baseColor }}
    >
      <svg className="w-full h-full" viewBox="0 0 80 80" preserveAspectRatio="none">
        <defs
          dangerouslySetInnerHTML={{
            __html: buildPatternElement(
              swatchId,
              patternId,
              baseColor,
              accentColor,
            ),
          }}
        />
        <rect width="80" height="80" fill={`url(#${swatchId})`} />
      </svg>
    </div>
  );
};

interface PatternDefsProps {
  id: string;
  patternId: PatternId;
  baseColor: string;
  accentColor: string;
}

/** Legacy export — used if referenced elsewhere */
export const PatternDefs = ({
  id,
  patternId,
  baseColor,
  accentColor,
}: PatternDefsProps) => (
  <defs
    dangerouslySetInnerHTML={{
      __html: buildPatternElement(id, patternId, baseColor, accentColor),
    }}
  />
);
