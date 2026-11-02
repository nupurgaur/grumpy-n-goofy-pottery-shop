import { forwardRef } from "react";
import type { PotDesign } from "@/config/potCustomizer";
import {
  getColorHex,
  POT_ACCENT_COLORS,
  POT_BASE_COLORS,
  POT_SKETCH_ASSETS,
} from "@/config/potCustomizer";
import { AccessoryIcon } from "@/components/customizer/AccessoryIcon";
import {
  buildPatternSvgDataUri,
  getPatternTileSize,
} from "@/lib/potPatternDefs";
import { cn } from "@/lib/utils";

interface PotPreviewProps {
  design: PotDesign;
  className?: string;
}

export const PotPreview = forwardRef<HTMLDivElement, PotPreviewProps>(
  ({ design, className }, ref) => {
    const baseHex = getColorHex(design.baseColor, POT_BASE_COLORS);
    const accentHex = getColorHex(design.accentColor, POT_ACCENT_COLORS);
    const assets = POT_SKETCH_ASSETS[design.potStyle];
    const tileSize = getPatternTileSize(design.pattern);
    const patternSvgUrl = buildPatternSvgDataUri(
      design.pattern,
      baseHex,
      accentHex,
    );
    return (
      <div ref={ref} data-pot-preview className={cn("overflow-visible", className)}>
        {/* Background card — separate from artwork so rounded corners never clip the handle */}
        <div
          className="relative overflow-visible rounded-2xl border border-border/30 bg-[#FAF6F0] p-8 sm:p-10 min-h-[400px] sm:min-h-[460px] flex items-center justify-center"
          aria-hidden={false}
        >
          <div
            data-pot-preview-canvas
            data-sketch-padding={assets.sketchPadding}
            data-sketch-scale={assets.sketchScale}
            className="relative w-full max-w-[360px] sm:max-w-[400px] aspect-square overflow-visible"
            style={{ padding: assets.sketchPadding }}
          >
            <div
              className="relative h-full w-full origin-center overflow-visible"
              style={{ transform: `scale(${assets.sketchScale})` }}
            >
              <div
                data-pot-pattern-layer
                data-pattern-tile-size={tileSize}
                aria-hidden
                className="absolute inset-0"
                style={{
                  backgroundImage: patternSvgUrl,
                  backgroundSize: `${tileSize}px ${tileSize}px`,
                  WebkitMaskImage: `url(${assets.fillMask})`,
                  maskImage: `url(${assets.fillMask})`,
                  WebkitMaskSize: "contain",
                  maskSize: "contain",
                  WebkitMaskRepeat: "no-repeat",
                  maskRepeat: "no-repeat",
                  WebkitMaskPosition: "center",
                  maskPosition: "center",
                }}
              />

              <img
                data-pot-sketch-layer
                src={assets.sketch}
                alt=""
                className="absolute inset-0 h-full w-full object-contain object-center pointer-events-none select-none"
                draggable={false}
              />

              <div
                data-accessory-preview
                className="absolute z-20 text-[#0D2B52] pointer-events-none"
                style={{
                  top: assets.accessoryTop,
                  left: assets.accessoryLeft,
                  transform: `translate(-50%, ${assets.accessoryTranslateY})`,
                }}
              >
                <AccessoryIcon
                  id={design.accessory}
                  size={assets.accessorySize}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  },
);

PotPreview.displayName = "PotPreview";
