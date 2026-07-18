import { createHash } from 'node:crypto';

/**
 * Safe quarantine record for rejected market data (US137).
 * Retains reason + opaque raw reference — never secrets or full private payloads.
 */
export type MarketDataQuarantineRecord = Readonly<{
  quarantineId: string;
  workspaceId: string;
  sourceId: string;
  instrument: string | null;
  streamId: string | null;
  channel: string | null;
  reason: string;
  /** Opaque fingerprint of the raw message — not the raw body. */
  rawMessageRef: string;
  quarantinedAt: string;
}>;

export type CreateQuarantineInput = {
  workspaceId: string;
  sourceId: string;
  instrument?: string | null;
  streamId?: string | null;
  channel?: string | null;
  reason: string;
  /** Raw adapter-local payload used only to compute a fingerprint. */
  rawMessage: unknown;
  quarantinedAt: string;
  quarantineId?: string;
};

const SECRET_KEY_PATTERN =
  /(api[_-]?key|api[_-]?secret|secret|password|token|private[_-]?key|authorization)/i;

/**
 * Build a quarantine record. Strips secret-like keys before hashing.
 * Never stores the raw message body.
 */
export function createMarketDataQuarantine(
  input: CreateQuarantineInput,
): MarketDataQuarantineRecord {
  const reason = input.reason.trim();
  if (reason === '') {
    throw new Error('quarantine reason must not be empty');
  }

  const sanitized = sanitizeForFingerprint(input.rawMessage);
  assertNoSecrets(sanitized);

  const rawMessageRef = fingerprint(sanitized);
  const quarantineId =
    input.quarantineId?.trim() ||
    `q:${input.workspaceId}:${rawMessageRef.slice(0, 16)}:${Date.parse(input.quarantinedAt) || 0}`;

  return Object.freeze({
    quarantineId,
    workspaceId: input.workspaceId.trim(),
    sourceId: String(input.sourceId).trim(),
    instrument: input.instrument ?? null,
    streamId: input.streamId ?? null,
    channel: input.channel ?? null,
    reason,
    rawMessageRef,
    quarantinedAt: input.quarantinedAt,
  });
}

function sanitizeForFingerprint(value: unknown): unknown {
  if (value === null || typeof value !== 'object') {
    return value;
  }
  if (Array.isArray(value)) {
    return value.map(sanitizeForFingerprint);
  }
  const out: Record<string, unknown> = {};
  for (const [key, child] of Object.entries(value as Record<string, unknown>)) {
    if (SECRET_KEY_PATTERN.test(key)) {
      continue;
    }
    out[key] = sanitizeForFingerprint(child);
  }
  return out;
}

function assertNoSecrets(value: unknown): void {
  const json = JSON.stringify(value);
  if (SECRET_KEY_PATTERN.test(json)) {
    throw new Error('quarantine must not retain secret-like fields');
  }
}

function fingerprint(value: unknown): string {
  return createHash('sha256').update(stableStringify(value)).digest('hex');
}

function stableStringify(value: unknown): string {
  if (value === null || typeof value !== 'object') {
    return JSON.stringify(value);
  }
  if (Array.isArray(value)) {
    return `[${value.map(stableStringify).join(',')}]`;
  }
  const entries = Object.entries(value as Record<string, unknown>).sort(([a], [b]) =>
    a.localeCompare(b),
  );
  return `{${entries.map(([k, v]) => `${JSON.stringify(k)}:${stableStringify(v)}`).join(',')}}`;
}
