import { describe, test, expect } from 'vitest';
import connector from './index.js';

describe('connector-slack-notification', () => {
  test('exports notification connector with the right metadata', () => {
    expect(connector.id).toBe('connector-slack-notification');
    expect(connector.capability).toBe('notification');
    expect(connector.version).toBe('0.1.0');
  });

  test('implementation has send + verifyDelivery', () => {
    const impl = connector.implementation;
    expect(typeof impl.send).toBe('function');
    expect(typeof impl.verifyDelivery).toBe('function');
  });
});
