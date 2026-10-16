import test from 'node:test';
import assert from 'node:assert/strict';
import { createPaymentApi } from '../src/payment.mjs';
import { createMobileCheckout } from '../src/checkout/mobile.mjs';
import { createDesktopCheckout } from '../src/checkout/desktop.mjs';

test('ordinary mobile checkout creates one paid order', async () => {
  const payment = createPaymentApi();
  const order = await createMobileCheckout(payment, 'cart-1').submit();
  assert.equal(order.status, 'paid');
  assert.equal(payment.orders().length, 1);
});

test('desktop timeout then Retry creates exactly one order', async () => {
  const payment = createPaymentApi({ timeoutFirstResponse: true });
  const checkout = createDesktopCheckout(payment, 'cart-2');
  await assert.rejects(checkout.submit(), { code: 'PAYMENT_TIMEOUT' });
  assert.equal((await checkout.submit()).id, 'order-1');
  assert.equal(payment.orders().length, 1);
});

test('mobile timeout then Retry creates exactly one order', async () => {
  const payment = createPaymentApi({ timeoutFirstResponse: true });
  const checkout = createMobileCheckout(payment, 'cart-3');
  await assert.rejects(checkout.submit(), { code: 'PAYMENT_TIMEOUT' });
  await checkout.submit();
  assert.equal(payment.orders().length, 1);
});
