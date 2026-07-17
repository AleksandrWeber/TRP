import { describe, expect, it } from 'vitest';
import { API_VERSION } from './api-version';

describe('API versioning (US114)', () => {
  it('exposes URI version constant used by controllers', () => {
    expect(API_VERSION).toBe('1');
  });
});
