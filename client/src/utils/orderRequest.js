import { formatMoney } from './currency.js';

// Catalog prices remain GBP even when a customer views another display currency.
export function buildOrderRequest(user, cart) {
  const subtotal = cart.items.reduce((sum, item) => sum + Number(item.product.price) * item.quantity, 0);
  const address = [user.address, user.city, user.postcode, user.country].filter(Boolean).join(', ');
  const lines = [
    'Greetings!',
    'I would like to place an order from Fuji Card. Below are the details of my request:', '',
    '👤 *CLIENT INFORMATION*',
    `• Name: ${user.firstName} ${user.lastName}`,
    `• Email: ${user.email}`,
    `• Phone: ${user.phone}`,
    `• Location: ${address}`, '',
    '💳 *PAYMENT*',
    '• Payment method and availability to be confirmed by the store.', '',
    '📦 *ITEM SUMMARY*'
  ];
  cart.items.forEach((item, index) => {
    const price = Number(item.product.price);
    lines.push(`[Item ${index + 1}] *${item.product.name}*`,
      `   • Quantity: ${item.quantity}`,
      `   • Unit Price (GBP): ${formatMoney(price)}`,
      `   • Line Total (GBP): ${formatMoney(price * item.quantity)}`, '');
  });
  lines.push('──────────────', '💰 *ITEMS SUBTOTAL (GBP)*',
    `• Listed items: ${formatMoney(subtotal)}`,
    '• Shipping and final amount: to be confirmed by Fuji Card', '──────────────', '',
    'Please confirm availability, shipping, and the payment method before I pay.', 'Thank you!');
  return lines.join('\n');
}
