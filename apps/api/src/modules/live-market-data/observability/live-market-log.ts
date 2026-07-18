const SECRET_KEY_PATTERN =
  /(api[_-]?key|secret|password|token|authorization|credential|private[_-]?key)/i;

/**
 * Structured live-market log fields (US145).
 * Includes correlation/stream identity; strips secrets.
 */
export type LiveMarketLogFields = Readonly<{
  message: string;
  workspaceId?: string;
  sourceId?: string;
  streamId?: string;
  channel?: string;
  correlationId?: string;
  status?: string;
  [key: string]: unknown;
}>;

export type LiveMarketLogRecord = Readonly<{
  level: 'info' | 'warn' | 'error';
  message: string;
  workspaceId?: string;
  sourceId?: string;
  streamId?: string;
  channel?: string;
  correlationId?: string;
  status?: string;
  timestamp: string;
}>;

/**
 * Build a secret-safe structured log record (US145 / ADR-018 #59).
 */
export function buildLiveMarketLog(
  level: LiveMarketLogRecord['level'],
  fields: LiveMarketLogFields,
  timestamp: string,
): LiveMarketLogRecord {
  const sanitized = sanitizeLogFields(fields);
  return Object.freeze({
    level,
    message: String(sanitized.message),
    ...(sanitized.workspaceId !== undefined ? { workspaceId: String(sanitized.workspaceId) } : {}),
    ...(sanitized.sourceId !== undefined ? { sourceId: String(sanitized.sourceId) } : {}),
    ...(sanitized.streamId !== undefined ? { streamId: String(sanitized.streamId) } : {}),
    ...(sanitized.channel !== undefined ? { channel: String(sanitized.channel) } : {}),
    ...(sanitized.correlationId !== undefined
      ? { correlationId: String(sanitized.correlationId) }
      : {}),
    ...(sanitized.status !== undefined ? { status: String(sanitized.status) } : {}),
    timestamp,
  });
}

export function sanitizeLogFields(fields: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(fields)) {
    if (SECRET_KEY_PATTERN.test(key)) continue;
    if (value !== null && typeof value === 'object' && !Array.isArray(value)) {
      out[key] = sanitizeLogFields(value as Record<string, unknown>);
      continue;
    }
    if (typeof value === 'string' && looksLikeSecretValue(value)) continue;
    out[key] = value;
  }
  return out;
}

function looksLikeSecretValue(value: string): boolean {
  // Bearer tokens / long opaque secrets — never log.
  if (/^Bearer\s+/i.test(value)) return true;
  if (value.length >= 40 && /^[A-Za-z0-9+/=_-]+$/.test(value)) return true;
  return false;
}
