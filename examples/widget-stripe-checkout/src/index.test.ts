import { describe, test, expect } from 'vitest';
import widget from './index.js';

describe('widget-stripe-checkout', () => {
  test('exports defineWidget result with the right metadata', () => {
    expect(widget.id).toBe('stripe-checkout');
    expect(widget.version).toBe('0.1.0');
    expect(widget.authRule).toBe('signed-in');
  });

  test('declares slot eligibility + form-aware capability', () => {
    expect(widget.slotEligibility).toContain('form-field');
    expect(widget.capabilities?.formAware).toBe(true);
  });

  test('configSchema requires amount + currency', () => {
    const required = widget.configSchema?.required ?? [];
    expect(required).toContain('amount');
    expect(required).toContain('currency');
  });
});
