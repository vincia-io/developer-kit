import { describe, test, expect } from 'vitest';
import connector from './index.js';

describe('connector-sendgrid-mailbox', () => {
  test('exports mailbox connector with the right metadata', () => {
    expect(connector.id).toBe('connector-sendgrid-mailbox');
    expect(connector.capability).toBe('mailbox');
    expect(connector.version).toBe('0.1.0');
  });

  test('implementation has all three MailboxProvider methods', () => {
    const impl = connector.implementation;
    expect(typeof impl.connect).toBe('function');
    expect(typeof impl.sync).toBe('function');
    expect(typeof impl.send).toBe('function');
  });
});
