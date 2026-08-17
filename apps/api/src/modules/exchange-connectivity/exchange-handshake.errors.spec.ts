import { describe, expect, it } from 'vitest';
import {
  isAbortError,
  isNetworkError,
  mapHandshakeAdapterKind,
  mapHandshakeHttpFailure,
  readProviderErrorCode,
} from './exchange-handshake.errors';

describe('Handshake error mapping (W2-S02-b)', () => {
  it('maps adapter kinds onto operator-safe handshake outcomes', () => {
    expect(mapHandshakeAdapterKind('authenticated')).toBe('CONNECTED');
    expect(mapHandshakeAdapterKind('authentication_failed')).toBe('AUTHENTICATION_FAILED');
    expect(mapHandshakeAdapterKind('provider_unavailable')).toBe('PROVIDER_UNAVAILABLE');
    expect(mapHandshakeAdapterKind('timeout')).toBe('HANDSHAKE_TIMEOUT');
    expect(mapHandshakeAdapterKind('not_implemented')).toBe('VALIDATION_FAILED');
    expect(mapHandshakeAdapterKind('failed')).toBe('VALIDATION_FAILED');
  });

  it('maps HTTP and venue codes without using the provider message', () => {
    expect(mapHandshakeHttpFailure(401, -2015)).toBe('authentication_failed');
    expect(mapHandshakeHttpFailure(400, -1022)).toBe('authentication_failed');
    expect(mapHandshakeHttpFailure(429, -1003)).toBe('provider_unavailable');
    expect(mapHandshakeHttpFailure(503, null)).toBe('provider_unavailable');
    expect(mapHandshakeHttpFailure(400, -1100)).toBe('failed');
    expect(readProviderErrorCode('{"code":-2015,"msg":"Invalid API-key"}')).toBe(-2015);
    expect(readProviderErrorCode('not-json')).toBeNull();
  });

  it('classifies abort as timeout and DNS/connect failures as unavailable', () => {
    const abort = new Error('aborted');
    abort.name = 'AbortError';
    expect(isAbortError(abort)).toBe(true);
    expect(isNetworkError({ code: 'ENOTFOUND' })).toBe(true);
    expect(isNetworkError({ message: 'fetch failed' })).toBe(true);
    expect(isNetworkError({ message: 'unexpected' })).toBe(false);
  });
});
