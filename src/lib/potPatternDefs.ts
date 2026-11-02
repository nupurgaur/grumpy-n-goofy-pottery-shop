import type { PatternId } from "@/config/potCustomizer";

/** Tile size used when tiling patterns on the pot preview */
export const getPatternTileSize = (patternId: PatternId): number => {
  switch (patternId) {
    case "checkerboard":
      return 32;
    case "polka-dots":
      return 140;
    case "stripes":
      return 48;
    case "wavy-lines":
      return 72;
    case "floral":
      return 80;
    case "solid":
    default:
      return 1;
  }
};

/** SVG `<pattern>` inner markup for React or data-URI backgrounds */
export const buildPatternElement = (
  id: string,
  patternId: PatternId,
  baseColor: string,
  accentColor: string,
): string => {
  switch (patternId) {
    case "checkerboard":
      return `<pattern id="${id}" width="32" height="32" patternUnits="userSpaceOnUse">
        <rect width="32" height="32" fill="${baseColor}"/>
        <rect width="16" height="16" fill="${accentColor}"/>
        <rect x="16" y="16" width="16" height="16" fill="${accentColor}"/>
      </pattern>`;
    case "polka-dots":
      return `<pattern id="${id}" width="140" height="140" patternUnits="userSpaceOnUse">
        <rect width="140" height="140" fill="${baseColor}"/>
        <circle cx="34" cy="48" r="16" fill="${accentColor}" opacity="0.92"/>
        <circle cx="98" cy="28" r="13" fill="${accentColor}" opacity="0.88"/>
        <circle cx="72" cy="96" r="18" fill="${accentColor}" opacity="0.9"/>
        <circle cx="118" cy="112" r="12" fill="${accentColor}" opacity="0.86"/>
        <circle cx="22" cy="118" r="14" fill="${accentColor}" opacity="0.9"/>
        <circle cx="56" cy="18" r="11" fill="${accentColor}" opacity="0.85"/>
        <circle cx="108" cy="72" r="15" fill="${accentColor}" opacity="0.88"/>
      </pattern>`;
    case "stripes":
      return `<pattern id="${id}" width="24" height="24" patternUnits="userSpaceOnUse">
        <rect width="24" height="24" fill="${baseColor}"/>
        <rect x="0" width="12" height="24" fill="${accentColor}" opacity="0.85"/>
      </pattern>`;
    case "wavy-lines":
      return `<pattern id="${id}" width="48" height="24" patternUnits="userSpaceOnUse">
        <rect width="48" height="24" fill="${baseColor}"/>
        <path d="M0 12 Q12 0 24 12 T48 12" stroke="${accentColor}" stroke-width="3" fill="none" opacity="0.9"/>
      </pattern>`;
    case "floral":
      return `<pattern id="${id}" width="40" height="40" patternUnits="userSpaceOnUse">
        <rect width="40" height="40" fill="${baseColor}"/>
        <circle cx="20" cy="20" r="4" fill="${accentColor}" opacity="0.35"/>
        <circle cx="8" cy="12" r="2.5" fill="${accentColor}" opacity="0.5"/>
        <circle cx="32" cy="28" r="2.5" fill="${accentColor}" opacity="0.5"/>
      </pattern>`;
    case "solid":
    default:
      return `<pattern id="${id}" width="1" height="1" patternUnits="userSpaceOnUse">
        <rect width="1" height="1" fill="${baseColor}"/>
      </pattern>`;
  }
};

export const buildPatternSvgDataUri = (
  patternId: PatternId,
  baseColor: string,
  accentColor: string,
  patternRef = "p",
): string => {
  const tile = getPatternTileSize(patternId);
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${tile}" height="${tile}" viewBox="0 0 ${tile} ${tile}">
    <defs>${buildPatternElement(patternRef, patternId, baseColor, accentColor)}</defs>
    <rect width="${tile}" height="${tile}" fill="url(#${patternRef})"/>
  </svg>`;
  return `url("data:image/svg+xml,${encodeURIComponent(svg)}")`;
};
