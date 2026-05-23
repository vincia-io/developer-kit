import { describe, test, expect } from 'vitest';
import connector from './index.js';

describe('connector-google-auth-provider', () => {
  test('exports auth connector with the right metadata', () => {
    expect(connector.id).toBe('connector-google-auth-provider');
    expect(connector.capability).toBe('auth-provider');
    expect(connector.version).toBe('0.1.0');
  });

  test('implementation has all four OAuthProvider methods', () => {
    const impl = connector.implementation;
    expect(typeof impl.getAuthorizeUrl).toBe('function');
    expect(typeof impl.exchangeCode).toBe('function');
    expect(typeof impl.refreshToken).toBe('function');
    expect(typeof impl.getUserInfo).toBe('function');
  });
});
