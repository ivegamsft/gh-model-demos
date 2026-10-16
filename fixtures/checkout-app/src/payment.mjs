export class PaymentTimeout extends Error {
  constructor() {
    super('Payment response timed out after the order was committed');
    this.code = 'PAYMENT_TIMEOUT';
  }
}

export function createPaymentApi({ timeoutFirstResponse = false } = {}) {
  const ordersByKey = new Map();
  let calls = 0;
  return {
    async charge({ cartId, idempotencyKey }) {
      if (!cartId || !idempotencyKey) throw new TypeError('cartId and idempotencyKey required');
      calls += 1;
      if (!ordersByKey.has(idempotencyKey)) {
        ordersByKey.set(idempotencyKey, {
          id: `order-${ordersByKey.size + 1}`, cartId, status: 'paid',
        });
      }
      if (timeoutFirstResponse && calls === 1) throw new PaymentTimeout();
      return ordersByKey.get(idempotencyKey);
    },
    orders() {
      return [...ordersByKey.values()];
    },
  };
}
