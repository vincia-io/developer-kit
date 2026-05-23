import { describe, test, expect } from 'vitest';
import connector from './index.js';

describe('connector-s3-storage', () => {
  test('exports storage connector with the right metadata', () => {
    expect(connector.id).toBe('connector-s3-storage');
    expect(connector.capability).toBe('storage');
    expect(connector.version).toBe('0.1.0');
  });

  test('implementation has all five StorageProvider methods', () => {
    const impl = connector.implementation;
    expect(typeof impl.put).toBe('function');
    expect(typeof impl.get).toBe('function');
    expect(typeof impl.delete).toBe('function');
    expect(typeof impl.list).toBe('function');
    expect(typeof impl.presignUrl).toBe('function');
  });
});
