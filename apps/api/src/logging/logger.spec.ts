import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ConsoleLogger } from './console.logger';
import { resolveLoggerDriver } from './logger-driver';
import { NoOpLogger } from './noop.logger';

describe('Structured Logger (US111)', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('ConsoleLogger emits structured JSON with timestamp, level, component, message', () => {
    const info = vi.spyOn(console, 'info').mockImplementation(() => undefined);
    const logger = new ConsoleLogger('Auth').child('AuthenticationService');

    logger.info('Registered user', { userId: 'u-1', workspaceId: 'ws-1' });

    expect(info).toHaveBeenCalledTimes(1);
    const entry = JSON.parse(String(info.mock.calls[0]?.[0]));
    expect(entry).toMatchObject({
      level: 'info',
      component: 'AuthenticationService',
      message: 'Registered user',
      context: { userId: 'u-1', workspaceId: 'ws-1' },
    });
    expect(Number.isNaN(Date.parse(entry.timestamp))).toBe(false);
  });

  it('ConsoleLogger includes error name/message and stack outside production', () => {
    const prev = process.env.NODE_ENV;
    process.env.NODE_ENV = 'development';
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const logger = new ConsoleLogger('Jobs');

    try {
      logger.error('Job failed', { jobId: 'j-1' }, new Error('boom'));
      const entry = JSON.parse(String(errorSpy.mock.calls[0]?.[0]));
      expect(entry.error).toMatchObject({
        name: 'Error',
        message: 'boom',
      });
      expect(entry.error.stack).toEqual(expect.any(String));
    } finally {
      process.env.NODE_ENV = prev;
    }
  });

  it('ConsoleLogger omits stack in production', () => {
    const prev = process.env.NODE_ENV;
    process.env.NODE_ENV = 'production';
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const logger = new ConsoleLogger('Jobs');

    try {
      logger.error('Job failed', undefined, new Error('boom'));
      const entry = JSON.parse(String(errorSpy.mock.calls[0]?.[0]));
      expect(entry.error.stack).toBeUndefined();
    } finally {
      process.env.NODE_ENV = prev;
    }
  });

  it('NoOpLogger does not write to console', () => {
    const info = vi.spyOn(console, 'info').mockImplementation(() => undefined);
    const logger = new NoOpLogger().child('X');
    logger.info('silent');
    logger.error('silent', {}, new Error('x'));
    expect(info).not.toHaveBeenCalled();
  });

  it('resolveLoggerDriver defaults to noop under vitest', () => {
    expect(resolveLoggerDriver(() => undefined)).toBe('noop');
    expect(resolveLoggerDriver((key) => (key === 'LOGGER_DRIVER' ? 'console' : undefined))).toBe(
      'console',
    );
  });
});
