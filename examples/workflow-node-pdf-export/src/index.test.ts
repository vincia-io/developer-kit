import { describe, test, expect } from 'vitest';
import step from './index.js';

describe('workflow-node-pdf-export', () => {
  test('exports defineStep result with the right metadata', () => {
    expect(step.id).toBe('pdf-export');
    expect(step.version).toBe('1.0.0');
  });

  test('declares input + output schemas', () => {
    expect(step.inputs.required).toContain('template');
    expect(step.inputs.required).toContain('data');
    expect(step.outputs.required).toContain('pdfUrl');
    expect(step.outputs.required).toContain('byteCount');
  });

  test('execute is a function', () => {
    expect(typeof step.execute).toBe('function');
  });
});
