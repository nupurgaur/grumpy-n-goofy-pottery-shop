export interface ProductCatalogMeta {
  pieceType: string;
  adjectives: string[];
}

/** Piece type + adjectives keyed by normalized product name */
export const PRODUCT_CATALOG: Record<string, ProductCatalogMeta> = {
  "dark-knight": {
    pieceType: "Collector Mug",
    adjectives: ["Brooding", "Limited Batch"],
  },
  "the-worthy-mug": {
    pieceType: "Statement Mug",
    adjectives: ["Textural", "Handbuilt"],
  },
  "worthy-mug": {
    pieceType: "Statement Mug",
    adjectives: ["Textural", "Handbuilt"],
  },
  "ruff-morning-mug": {
    pieceType: "Character Mug",
    adjectives: ["Moody", "Collectible"],
  },
  "sunny-side-up": {
    pieceType: "Trinket Tray",
    adjectives: ["Dreamy", "Handbuilt"],
  },
  "sunny-side-up-tray": {
    pieceType: "Trinket Tray",
    adjectives: ["Dreamy", "Handbuilt"],
  },
  "avo-bai": {
    pieceType: "Snack Plate",
    adjectives: ["Whimsical", "Playful"],
  },
};

const normalizeProductName = (name: string) =>
  name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

export const getProductCatalogMeta = (productName: string): ProductCatalogMeta | null => {
  const key = normalizeProductName(productName);
  if (PRODUCT_CATALOG[key]) return PRODUCT_CATALOG[key];

  for (const [catalogKey, meta] of Object.entries(PRODUCT_CATALOG)) {
    if (key.includes(catalogKey) || catalogKey.includes(key)) {
      return meta;
    }
  }
  return null;
};
