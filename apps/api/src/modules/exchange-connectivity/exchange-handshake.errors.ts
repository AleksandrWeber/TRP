import type { ExchangeHandshakeAdapterKind } from './exchange-provider-adapter';
import type { ExchangeHandshakeOutcome } from './exchange-handshake.result';

const AUTHENTICATION_CODES = new Set([-1021, -1022, -2014, -2015]);
const RATE_LIMIT_CODES = new Set([-1003, -1015]);

export function mapHandshakeAdapterKind(
  kind: ExchangeHandshakeAdapterKind,
): ExchangeHandshakeOutcome {
  switch (kind) {
    case 'authenticated':
      return 'CONNECTED';
    case 'authentication_failed':
      return 'AUTHENTICATION_FAILED';
    case 'provider_unavailable':
      return 'PROVIDER_UNAVAILABLE';
    case 'timeout':
      return 'HANDSHAKE_TIMEOUT';
    case 'not_implemented':
    case 'failed':
      return 'VALIDATION_FAILED';
  }
}

export function mapHandshakeHttpFailure(
  status: number,
  errorCode: number | null,
): Exclude<ExchangeHandshakeAdapterKind, 'authenticated' | 'not_implemented'> {
  if (errorCode !== null && AUTHENTICATION_CODES.has(errorCode)) {
    return 'authentication_failed';
  }
  if (errorCode !== null && RATE_LIMIT_CODES.has(errorCode)) {
    return 'provider_unavailable';
  }
  if (status === 401 || status === 403) {
    return 'authentication_failed';
  }
  if (status === 418 || status === 429 || status >= 500) {
    return 'provider_unavailable';
  }
  if (status >= 400) {
    return 'failed';
  }
  return 'provider_unavailable';
}

export function readProviderErrorCode(bodyText: string): number | null {
  try {
    const parsed = JSON.parse(bodyText) as { code?: unknown };
    return typeof parsed.code === 'number' ? parsed.code : null;
  } catch {
    return null;
  }
}

export function isAbortError(error: unknown): boolean {
  if (!error || typeof error !== 'object') {
    return false;
  }
  const candidate = error as { name?: unknown; code?: unknown };
  return candidate.name === 'AbortError' || candidate.name === 'TimeoutError';
}

export function isNetworkError(error: unknown): boolean {
  if (!error || typeof error !== 'object') {
    return false;
  }
  const candidate = error as { code?: unknown; cause?: { code?: unknown }; message?: unknown };
  const code = typeof candidate.code === 'string' ? candidate.code : candidate.cause?.code;
  if (
    code === 'ENOTFOUND' ||
    code === 'ECONNREFUSED' ||
    code === 'ECONNRESET' ||
    code === 'ETIMEDOUT' ||
    code === 'EHOSTUNREACH' ||
    code === 'UND_ERR_CONNECT_TIMEOUT'
  ) {
    return true;
  }
  return typeof candidate.message === 'string' && /fetch failed|network/i.test(candidate.message);
}
