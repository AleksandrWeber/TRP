import { describe, expect, it } from 'vitest';
import { projectExchangeCapabilities } from './exchange-capability.projection';

const cached = {
  capabilities: [{ capability: 'REST' as const, state: 'SUPPORTED' as const }],
  verifiedAt: '2026-08-17T19:00:00.000Z',
  verificationFailed: false,
};

describe('Exchange capability projection (W2-S02-d)', () => {
  it('projects verified capabilities only for a connected Exchange session', () => {
    expect(projectExchangeCapabilities('EXCHANGE', 'CONNECTED', cached)).toEqual(cached);
    expect(projectExchangeCapabilities('EXCHANGE', 'DISCONNECTED', cached)).toBeNull();
    expect(projectExchangeCapabilities('EXCHANGE', 'VALIDATION_FAILED', cached)).toBeNull();
    expect(projectExchangeCapabilities('NOTIFICATION', 'CONNECTED', cached)).toBeNull();
    expect(projectExchangeCapabilities('EXCHANGE', 'CONNECTED', null)).toBeNull();
  });
});
