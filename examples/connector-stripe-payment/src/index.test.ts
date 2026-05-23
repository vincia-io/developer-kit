/**
 * Smoke test for connector-stripe-payment.
 *
 * The real Stripe API is NOT called here — the test asserts that
 * defineConnector returns the right metadata + that each method exists
 * with the right signature. Drive real flow tests via the
 * `@vincia/sdk/testing` fake-fetch harness once you wire it in.
 */
import { describe, test, expect } from 'vitest';
import connector from './index.js';

describe('connector-stripe-payment', () => {
  test('exports payment connector with the right metadata', () => {
    expect(connector.id).toBe('connector-stripe-payment');
    expect(connector.capability).toBe('payment');
    expect(connector.version).toBe('0.1.0');
  });

  test('implementation has all four PaymentProvider methods', () => {
    const impl = connector.implementation;
    expect(typeof impl.createIntent).toBe('function');
    expect(typeof impl.capture).toBe('function');
    expect(typeof impl.refund).toBe('function');
    expect(typeof impl.verifyWebhook).toBe('function');
  });
});
