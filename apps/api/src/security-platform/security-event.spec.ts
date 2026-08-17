import { describe, expect, it, vi } from 'vitest';
import type { Logger } from '../logging/logger';
import { emitPlatformSecurityEvent } from './security-event';

describe('security-event (V3-S04-e)', () => {
  it('emits structured non-secret platform security events', () => {
    const logger: Logger = {
      child: () => logger,
      debug: vi.fn(),
      info: vi.fn(),
      warn: vi.fn(),
      error: vi.fn(),
    };

    emitPlatformSecurityEvent(logger, {
      type: 'platform.abuse.throttled',
      ip: '203.0.113.10',
      path: '/v1/auth/login',
      statusCode: 429,
    });

    expect(logger.warn).toHaveBeenCalledWith('Platform security event', {
      event: 'platform.abuse.throttled',
      outcome: 'throttled',
      ip: '203.0.113.10',
      path: '/v1/auth/login',
      statusCode: 429,
    });
  });
});
