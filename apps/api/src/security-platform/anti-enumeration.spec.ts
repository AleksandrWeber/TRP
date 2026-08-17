import { describe, expect, it } from 'vitest';
import {
  isExistenceOracleMessage,
  PLATFORM_ACCESS_DENIED_MESSAGE,
  shapePlatformDeny,
} from './anti-enumeration';

describe('anti-enumeration (V3-S04-d)', () => {
  it('detects existence-revealing deny messages', () => {
    expect(isExistenceOracleMessage('User not found')).toBe(true);
    expect(isExistenceOracleMessage('Resource does not exist')).toBe(true);
    expect(isExistenceOracleMessage('No such session')).toBe(true);
    expect(isExistenceOracleMessage('Unknown user id')).toBe(true);
  });

  it('preserves non-oracle operational messages', () => {
    expect(isExistenceOracleMessage('Forbidden resource')).toBe(false);
    expect(isExistenceOracleMessage('Access denied')).toBe(false);
    expect(isExistenceOracleMessage('Invalid email or password.')).toBe(false);
  });

  it('normalizes oracle 404 and 403 responses to a single deny shape', () => {
    expect(shapePlatformDeny(404, 'User not found')).toEqual({
      statusCode: 403,
      message: PLATFORM_ACCESS_DENIED_MESSAGE,
    });
    expect(shapePlatformDeny(403, 'User does not exist')).toEqual({
      statusCode: 403,
      message: PLATFORM_ACCESS_DENIED_MESSAGE,
    });
  });

  it('leaves non-oracle and non-deny statuses unchanged', () => {
    expect(shapePlatformDeny(401, 'Unauthorized')).toBeNull();
    expect(shapePlatformDeny(404, 'Page unavailable')).toBeNull();
    expect(shapePlatformDeny(403, 'Forbidden resource')).toBeNull();
  });
});
