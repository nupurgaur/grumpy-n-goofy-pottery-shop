const WORKSHOP_CART_ID_MIN = 9900000;
const WORKSHOP_CART_ID_MAX = 9999999;

export const WORKSHOP_ORDER_PRODUCT_IDS = {
  paintYourOwnPot: 9991,
  handbuilding: 9992,
  wheelThrowing: 9993,
  dateNight: 9994,
  privateClayParties: 9995,
} as const;

export function isWorkshopCartProductId(productId: number): boolean {
  return productId >= WORKSHOP_CART_ID_MIN && productId <= WORKSHOP_CART_ID_MAX;
}

export function isWorkshopCartItem(item: { product_id: number; product_name?: string }): boolean {
  return (
    isWorkshopCartProductId(item.product_id) ||
    String(item.product_name ?? '').startsWith('Workshop —')
  );
}

export function resolveWorkshopOrderProductId(productName: string): number {
  const name = productName.toLowerCase();

  if (name.includes('paint your own pot')) {
    return WORKSHOP_ORDER_PRODUCT_IDS.paintYourOwnPot;
  }
  if (name.includes('handbuilding')) {
    return WORKSHOP_ORDER_PRODUCT_IDS.handbuilding;
  }
  if (name.includes('wheel throwing')) {
    return WORKSHOP_ORDER_PRODUCT_IDS.wheelThrowing;
  }
  if (name.includes('date night') || name.includes('clay date')) {
    return WORKSHOP_ORDER_PRODUCT_IDS.dateNight;
  }
  if (name.includes('private clay')) {
    return WORKSHOP_ORDER_PRODUCT_IDS.privateClayParties;
  }

  return WORKSHOP_ORDER_PRODUCT_IDS.paintYourOwnPot;
}

export function resolveOrderItemProductId(item: {
  product_id: number;
  product_name: string;
}, customPotProductId = 9999): number {
  if (isWorkshopCartItem(item)) {
    return resolveWorkshopOrderProductId(item.product_name);
  }

  if (item.product_id === customPotProductId) {
    return customPotProductId;
  }

  return item.product_id;
}
