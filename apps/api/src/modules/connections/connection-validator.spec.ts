import { describe, expect, it } from 'vitest';
import { DeterministicConnectionValidator } from './connection-validator';

describe('DeterministicConnectionValidator (W2-S01-c)', () => {
  it('returns deterministic provider-independent outcomes without runtime provider access', async () => {
    const validator = new DeterministicConnectionValidator();
    const base = {
      workspaceId: 'workspace-a',
      connectionId: 'connection-a',
      provider: 'BINANCE' as const,
    };

    await expect(
      validator.validate({ ...base, credentials: { apiKey: 'key', apiSecret: 'secret' } }),
    ).resolves.toEqual({ outcome: 'succeeded' });
    await expect(validator.validate({ ...base, credentials: {} })).resolves.toEqual({
      outcome: 'failed',
    });
  });
});
