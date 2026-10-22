/** Configurable data for the Design Your Own Pot customizer */

export type PotStyleId = "pinch-pot" | "cylinder";
export type PatternId =
  | "checkerboard"
  | "stripes"
  | "polka-dots"
  | "wavy-lines"
  | "floral"
  | "solid";
export type AccessoryId =
  | "bow"
  | "penguin"
  | "doggo"
  | "cat"
  | "flower"
  | "star"
  | "heart"
  | "bee";
export type ColorId = string;

export interface PotStyleOption {
  id: PotStyleId;
  label: string;
  description: string;
}

export interface PatternOption {
  id: PatternId;
  label: string;
}

export interface AccessoryOption {
  id: AccessoryId;
  label: string;
}

export interface ColorOption {
  id: ColorId;
  label: string;
  hex: string;
}

export interface PotDesign {
  potStyle: PotStyleId;
  pattern: PatternId;
  accessory: AccessoryId;
  baseColor: ColorId;
  accentColor: ColorId;
}

export const POT_CUSTOMIZER_STORAGE_KEY = "gnp-pot-design";
export const CUSTOM_POT_PRICE = 1999;
export const CUSTOM_POT_DELIVERY_ESTIMATE = "3–4 weeks";
export const CUSTOM_POT_PREORDERS_OPEN = true;
/** Must match seeded product in supabase/migrations */
export const CUSTOM_POT_PRODUCT_ID = 9999;
export const CUSTOM_POT_IMAGE = "/pot-sketches/pinch-pot-sketch.png";
export const POT_SKETCH_ASSETS: Record<
  PotStyleId,
  {
    sketch: string;
    fillMask: string;
    /** Anchor on the top handle joint */
    accessoryTop: string;
    accessoryLeft: string;
    accessorySize: number;
    accessoryTranslateY: string;
    /** CSS padding on preview canvas — extra right space keeps handle visible */
    sketchPadding: string;
    sketchScale: number;
  }
> = {
  "pinch-pot": {
    sketch: "/pot-sketches/pinch-pot-sketch.png",
    fillMask: "/pot-sketches/pinch-pot-fill-mask.png",
    accessoryTop: "31%",
    accessoryLeft: "67%",
    accessorySize: 30,
    accessoryTranslateY: "-45%",
    sketchPadding: "6% 14% 6% 4%",
    sketchScale: 0.9,
  },
  cylinder: {
    sketch: "/pot-sketches/cylinder-sketch.png",
    fillMask: "/pot-sketches/cylinder-fill-mask.png",
    accessoryTop: "27%",
    accessoryLeft: "64%",
    accessorySize: 30,
    accessoryTranslateY: "-45%",
    sketchPadding: "6% 12% 6% 6%",
    sketchScale: 0.9,
  },
};

export const POT_PREVIEW_ASPECT = "1 / 1";

export type CustomizerTab = "shape" | "pattern" | "accessory" | "color";

export const CUSTOMIZER_TABS: { id: CustomizerTab; label: string }[] = [
  { id: "shape", label: "Shape" },
  { id: "pattern", label: "Pattern" },
  { id: "accessory", label: "Accessory" },
  { id: "color", label: "Color" },
];

export const DEFAULT_POT_DESIGN: PotDesign = {
  potStyle: "pinch-pot",
  pattern: "checkerboard",
  accessory: "bow",
  baseColor: "off-white",
  accentColor: "dusty-pink",
};

export const POT_STYLES: PotStyleOption[] = [
  {
    id: "pinch-pot",
    label: "Pinch Pot",
    description: "A rounded cup with a handle — classic and cozy.",
  },
  {
    id: "cylinder",
    label: "Cylinder",
    description: "A straight-sided mug with room for bold patterns.",
  },
];

export const POT_PATTERNS: PatternOption[] = [
  { id: "checkerboard", label: "Checkerboard" },
  { id: "stripes", label: "Stripes" },
  { id: "polka-dots", label: "Polka Dots" },
  { id: "wavy-lines", label: "Wavy Lines" },
  { id: "floral", label: "Floral" },
  { id: "solid", label: "Solid Color" },
];

export const POT_ACCESSORIES: AccessoryOption[] = [
  { id: "bow", label: "Bow" },
  { id: "penguin", label: "Penguin" },
  { id: "doggo", label: "Doggo" },
  { id: "cat", label: "Cat" },
  { id: "flower", label: "Flower" },
  { id: "star", label: "Star" },
  { id: "heart", label: "Heart" },
  { id: "bee", label: "Bee" },
];

export const POT_BASE_COLORS: ColorOption[] = [
  { id: "off-white", label: "Off White", hex: "#F5F3EF" },
  { id: "cream", label: "Cream", hex: "#FAF6F0" },
  { id: "light-blue", label: "Light Blue", hex: "#A7C7E7" },
  { id: "navy", label: "Navy", hex: "#0D2B52" },
  { id: "charcoal", label: "Charcoal", hex: "#2E2E2E" },
  { id: "blush", label: "Blush", hex: "#F4D4DC" },
];

export const POT_ACCENT_COLORS: ColorOption[] = [
  { id: "dusty-pink", label: "Dusty Pink", hex: "#E88CA3" },
  { id: "navy", label: "Navy", hex: "#0D2B52" },
  { id: "light-blue", label: "Light Blue", hex: "#A7C7E7" },
  { id: "cream", label: "Cream", hex: "#FAF6F0" },
  { id: "sage", label: "Sage", hex: "#B8C9B0" },
  { id: "terracotta", label: "Terracotta", hex: "#C97B63" },
];

export const getColorHex = (
  colorId: ColorId,
  palette: ColorOption[],
): string =>
  palette.find((c) => c.id === colorId)?.hex ?? palette[0].hex;

export const normalizePotStyleId = (value: unknown): PotStyleId | null => {
  if (value === "pinch-pot" || value === "pin-pot") return "pinch-pot";
  if (value === "cylinder" || value === "mug") return "cylinder";
  return null;
};

export const normalizeAccessoryId = (value: unknown): AccessoryId => {
  if (value === "bear") return "doggo";
  if (value === "daisy" || value === "tulip") return "flower";
  if (POT_ACCESSORIES.some((a) => a.id === value)) {
    return value as AccessoryId;
  }
  return DEFAULT_POT_DESIGN.accessory;
};

export const isValidPotDesign = (value: unknown): value is PotDesign => {
  if (!value || typeof value !== "object") return false;
  const d = value as PotDesign & { potStyle?: unknown; accessory?: unknown };
  const style = normalizePotStyleId(d.potStyle);
  if (!style) return false;
  return (
    POT_PATTERNS.some((p) => p.id === d.pattern) &&
    POT_BASE_COLORS.some((c) => c.id === d.baseColor) &&
    POT_ACCENT_COLORS.some((c) => c.id === d.accentColor)
  );
};

export const normalizePotDesign = (value: unknown): PotDesign => {
  if (!value || typeof value !== "object") return DEFAULT_POT_DESIGN;
  const d = value as Partial<PotDesign> & { potStyle?: unknown; accessory?: unknown };
  const style = normalizePotStyleId(d.potStyle) ?? DEFAULT_POT_DESIGN.potStyle;
  return {
    potStyle: style,
    pattern: POT_PATTERNS.some((p) => p.id === d.pattern)
      ? (d.pattern as PotDesign["pattern"])
      : DEFAULT_POT_DESIGN.pattern,
    accessory: normalizeAccessoryId(d.accessory),
    baseColor: POT_BASE_COLORS.some((c) => c.id === d.baseColor)
      ? (d.baseColor as PotDesign["baseColor"])
      : DEFAULT_POT_DESIGN.baseColor,
    accentColor: POT_ACCENT_COLORS.some((c) => c.id === d.accentColor)
      ? (d.accentColor as PotDesign["accentColor"])
      : DEFAULT_POT_DESIGN.accentColor,
  };
};

export const buildCustomPotProductName = (design: PotDesign): string => {
  const style = POT_STYLES.find((s) => s.id === design.potStyle)?.label ?? design.potStyle;
  const pattern = POT_PATTERNS.find((p) => p.id === design.pattern)?.label ?? design.pattern;
  const accessory =
    POT_ACCESSORIES.find((a) => a.id === design.accessory)?.label ?? design.accessory;
  return `Custom Pot — ${style} · ${pattern} · ${accessory}`;
};

/** Stored on cart line — includes colors for fulfillment without extra DB columns */
export const buildCustomPotCartLabel = (design: PotDesign): string => {
  const base =
    POT_BASE_COLORS.find((c) => c.id === design.baseColor)?.label ?? design.baseColor;
  const accent =
    POT_ACCENT_COLORS.find((c) => c.id === design.accentColor)?.label ?? design.accentColor;
  return `${buildCustomPotProductName(design)} (${base} / ${accent})`;
};

export const isCustomPotCartItem = (productId: number, productName: string) =>
  productId === CUSTOM_POT_PRODUCT_ID || productName.startsWith("Custom Pot");

export const formatPotDesignSummary = (design: PotDesign): string => {
  const style = POT_STYLES.find((s) => s.id === design.potStyle)?.label ?? design.potStyle;
  const pattern = POT_PATTERNS.find((p) => p.id === design.pattern)?.label ?? design.pattern;
  const accessory =
    POT_ACCESSORIES.find((a) => a.id === design.accessory)?.label ?? design.accessory;
  const base =
    POT_BASE_COLORS.find((c) => c.id === design.baseColor)?.label ?? design.baseColor;
  const accent =
    POT_ACCENT_COLORS.find((c) => c.id === design.accentColor)?.label ?? design.accentColor;
  return [
    "Custom pot order:",
    "",
    `Shape: ${style}`,
    `Pattern: ${pattern}`,
    `Accessory: ${accessory}`,
    `Base color: ${base}`,
    `Accent color: ${accent}`,
    `Price: ₹${CUSTOM_POT_PRICE.toLocaleString("en-IN")}`,
  ].join("\n");
};
