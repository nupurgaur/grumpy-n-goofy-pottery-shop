/** Digital download templates — unlimited stock, no shipping */
export const TEMPLATE_STOCK_QUANTITY = 99999;

export type TemplateProduct = {
  is_template?: boolean | null;
};

export function isTemplateProduct(product: TemplateProduct): boolean {
  return product.is_template === true;
}

export const TEMPLATE_TAGLINE =
  "Printable PDF pottery template — instant download after purchase.";

export const TEMPLATE_DESCRIPTION = [
  "A printable PDF template designed for slab-building and handbuilding projects.",
  "Includes clear reference measurements so you can scale the pattern to your preferred size.",
  "Follow the outline on the page, cut your clay, and assemble your piece with confidence.",
];

export const TEMPLATE_PERFECT_FOR = [
  "Beginner ceramic artists",
  "Slab-building pottery projects",
  "DIY handmade pottery at home",
  "Pottery classes and workshops",
  "Practice pieces or small batch production",
];

export const TEMPLATE_BENEFITS = [
  "Beginner-friendly and easy to follow",
  "Saves time on designing proportions",
  "Helps create consistent shapes",
  "Ideal for practice or small batch production",
  "Works with stoneware, earthenware, or porcelain",
];

export const TEMPLATE_HOW_TO_USE = [
  "Download and print the template after purchase",
  "Roll out your clay slab evenly to the suggested thickness",
  "Cut the pattern from the slab and assemble your piece",
  "Refine edges and seams, then let your work dry slowly",
  "Bisque fire, glaze, and enjoy your finished piece",
];
