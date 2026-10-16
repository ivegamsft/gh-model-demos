export function createMobileCheckout(payment, cartId) {
  let attempt = 0;
  let pendingKey;
  return {
    async submit() {
      pendingKey ??= `${cartId}-mobile-${++attempt}`;
      try {
        const order = await payment.charge({ cartId, idempotencyKey: pendingKey });
        pendingKey = undefined;
        return order;
      } catch (error) {
        pendingKey = undefined;
        throw error;
      }
    },
  };
}
