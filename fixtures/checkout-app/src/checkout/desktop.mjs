export function createDesktopCheckout(payment, cartId) {
  let attempt = 0;
  let pendingKey;
  return {
    async submit() {
      pendingKey ??= `${cartId}-desktop-${++attempt}`;
      const order = await payment.charge({ cartId, idempotencyKey: pendingKey });
      pendingKey = undefined;
      return order;
    },
  };
}
