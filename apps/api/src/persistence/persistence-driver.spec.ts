import { describe, expect, it } from 'vitest';
import { resolvePersistenceDriver } from './persistence-driver';

describe('resolvePersistenceDriver (US104)', () => {
  it('defaults to memory', () => {
    expect(resolvePersistenceDriver(() => undefined)).toBe('memory');
  });

  it('selects prisma when configured', () => {
    expect(
      resolvePersistenceDriver((key) => (key === 'PERSISTENCE_DRIVER' ? 'prisma' : undefined)),
    ).toBe('prisma');
  });

  it('treats unknown values as memory', () => {
    expect(resolvePersistenceDriver(() => 'sqlite')).toBe('memory');
  });
});
