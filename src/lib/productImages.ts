import mugImage from "@/assets/IMG20250927153335 (2).jpg";
import vaseImage from "@/assets/IMG20250927152145.jpg";
import bowlImage from "@/assets/IMG20250927153430 (1).jpg";
import heroImage from "@/assets/IMG_20250929_021501 (2).jpg";

const FALLBACK_IMAGES = [mugImage, vaseImage, bowlImage, heroImage];

export const getProductImage = (imageUrl: string) => {
  if (imageUrl.includes("pottery-mug")) return mugImage;
  if (imageUrl.includes("pottery-vase")) return vaseImage;
  if (imageUrl.includes("pottery-bowl")) return bowlImage;
  return imageUrl;
};

export const getProductImages = (product: {
  images?: string[] | null;
  image_url?: string;
}) => {
  if (product.images && product.images.length > 0) {
    return product.images.map((img) => getProductImage(img));
  }
  if (product.image_url) {
    return [getProductImage(product.image_url)];
  }
  return FALLBACK_IMAGES;
};

export const productDetailPath = (productId: number) => `/products/${productId}`;
