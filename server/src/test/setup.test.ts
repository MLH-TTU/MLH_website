import { describe, it, expect } from 'vitest';
import { AuthProvider } from '../types';

describe('Project Setup', () => {
  it('should have proper environment setup', () => {
    expect(process.env.NODE_ENV).toBe('test');
  });

  it('should be able to import types', () => {
    expect(AuthProvider.GOOGLE).toBe('GOOGLE');
  });
});