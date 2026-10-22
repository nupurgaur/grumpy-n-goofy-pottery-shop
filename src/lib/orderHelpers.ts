type OrderLike = {
  shipping_address?: string | null;
  notes?: string | null;
  fulfillment_status?: string | null;
  address_snapshot?: unknown;
};

export function isTemplateOrder(order: OrderLike): boolean {
  if (order.fulfillment_status === 'template_delivered') return true;
  if (order.shipping_address?.includes('Digital template')) return true;
  if (order.notes?.includes('Template download')) return true;

  const snapshot = order.address_snapshot;
  if (snapshot && typeof snapshot === 'object' && snapshot !== null && 'type' in snapshot) {
    return (snapshot as { type?: string }).type === 'template';
  }

  return false;
}

export function isWorkshopOrder(order: OrderLike): boolean {
  if (order.fulfillment_status === 'workshop_confirmed') return true;
  if (order.shipping_address?.includes('Workshop booking')) return true;
  if (order.notes?.includes('Workshop booking')) return true;

  const snapshot = order.address_snapshot;
  if (snapshot && typeof snapshot === 'object' && snapshot !== null && 'type' in snapshot) {
    return (snapshot as { type?: string }).type === 'workshop';
  }

  return false;
}

export function canCancelOrder(order: OrderLike & { fulfillment_status?: string | null }): boolean {
  if (isTemplateOrder(order) || isWorkshopOrder(order)) return false;
  return order.fulfillment_status === 'pending' || order.fulfillment_status === 'processing';
}

export function canResendTemplateEmail(order: OrderLike & { payment_status?: string | null }): boolean {
  return isTemplateOrder(order) && order.payment_status === 'paid';
}
