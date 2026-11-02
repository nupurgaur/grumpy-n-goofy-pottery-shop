/** Private clay parties: optional contact request (no checkout charge). */

export const FOOD_BEVERAGE_CONTACT_ID = "food-beverage-contact";

export const DEFAULT_FOOD_BEVERAGE_CONTACT_LABEL =
  "I'm interested in food & beverages — we'll contact you separately to arrange.";

export const DEFAULT_FOOD_BEVERAGE_CONTACT_PAGE_NOTE =
  "Want food or drinks for your party? Tick the box when booking and we'll reach out to plan it with you.";

export type FoodBeverageContactConfig = {
  enabled: boolean;
  checkboxLabel: string;
  pageNote: string;
};

type StoredFoodBeverageContact = {
  id?: string;
  enabled?: boolean;
  checkboxLabel?: string;
  pageNote?: string;
  label?: string;
  price?: number;
  checkoutEnabled?: boolean;
};

export const DEFAULT_FOOD_BEVERAGE_CONTACT_CONFIG: FoodBeverageContactConfig = {
  enabled: true,
  checkboxLabel: DEFAULT_FOOD_BEVERAGE_CONTACT_LABEL,
  pageNote: DEFAULT_FOOD_BEVERAGE_CONTACT_PAGE_NOTE,
};

function readStoredContact(addOns: unknown): StoredFoodBeverageContact | null {
  if (!Array.isArray(addOns)) return null;
  for (const entry of addOns) {
    if (!entry || typeof entry !== "object" || Array.isArray(entry)) continue;
    const record = entry as StoredFoodBeverageContact;
    if (
      record.id === FOOD_BEVERAGE_CONTACT_ID ||
      record.id === "food-wine" ||
      record.checkboxLabel ||
      record.label
    ) {
      return record;
    }
  }
  return null;
}

export function parseFoodBeverageContactConfig(addOns: unknown): FoodBeverageContactConfig {
  const stored = readStoredContact(addOns);
  if (!stored) {
    return { ...DEFAULT_FOOD_BEVERAGE_CONTACT_CONFIG, enabled: false };
  }

  if (stored.id === FOOD_BEVERAGE_CONTACT_ID || stored.checkboxLabel) {
    return {
      enabled: stored.enabled !== false,
      checkboxLabel:
        stored.checkboxLabel?.trim() || DEFAULT_FOOD_BEVERAGE_CONTACT_LABEL,
      pageNote: stored.pageNote?.trim() || DEFAULT_FOOD_BEVERAGE_CONTACT_PAGE_NOTE,
    };
  }

  // Legacy paid food & wine add-on → contact-only, still show checkbox
  return {
    enabled: true,
    checkboxLabel: stored.label?.trim() || DEFAULT_FOOD_BEVERAGE_CONTACT_LABEL,
    pageNote: stored.pageNote?.trim() || DEFAULT_FOOD_BEVERAGE_CONTACT_PAGE_NOTE,
  };
}

export function encodeFoodBeverageContactAddOns(
  config: FoodBeverageContactConfig,
): StoredFoodBeverageContact[] {
  if (!config.enabled) return [];
  return [
    {
      id: FOOD_BEVERAGE_CONTACT_ID,
      enabled: true,
      checkboxLabel:
        config.checkboxLabel.trim() || DEFAULT_FOOD_BEVERAGE_CONTACT_LABEL,
      pageNote: config.pageNote.trim(),
    },
  ];
}
