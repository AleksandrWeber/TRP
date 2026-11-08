/**
 * US178 optional ledger-history cursor (TD-041, Option A).
 * Opaque base64url JSON. This is not cryptographic integrity protection.
 */

export const LEDGER_HISTORY_CURSOR_VERSION = 1;
export const LEDGER_HISTORY_MAX_LIMIT = 100;

export type LedgerHistoryPosition = Readonly<{
  occurredAt: string;
  id: string;
}>;

export type LedgerHistoryCursorScope = Readonly<{
  workspaceId: string;
  paperAccountId: string;
}>;

export class LedgerHistoryCursorError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'LedgerHistoryCursorError';
  }
}

const INVALID_CURSOR = 'Ledger history cursor is invalid.';
const SCOPE_MISMATCH = 'Ledger history cursor does not match the requested workspace and account.';

export function encodeLedgerHistoryCursor(
  scope: LedgerHistoryCursorScope,
  position: LedgerHistoryPosition,
): string {
  const occurredAt = canonicalUtcTimestamp(position.occurredAt);
  const id = requiredId(position.id);
  const payload = {
    v: LEDGER_HISTORY_CURSOR_VERSION,
    workspaceId: scope.workspaceId,
    paperAccountId: scope.paperAccountId,
    occurredAt,
    id,
  };
  return Buffer.from(JSON.stringify(payload), 'utf8').toString('base64url');
}

export function decodeLedgerHistoryCursor(
  value: string,
  scope: LedgerHistoryCursorScope,
): LedgerHistoryPosition {
  let parsed: unknown;
  try {
    parsed = JSON.parse(Buffer.from(value, 'base64url').toString('utf8'));
  } catch {
    throw new LedgerHistoryCursorError(INVALID_CURSOR);
  }
  if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
    throw new LedgerHistoryCursorError(INVALID_CURSOR);
  }
  const record = parsed as Record<string, unknown>;
  const keys = Object.keys(record);
  if (
    keys.length !== 5 ||
    record.v !== LEDGER_HISTORY_CURSOR_VERSION ||
    typeof record.workspaceId !== 'string' ||
    typeof record.paperAccountId !== 'string' ||
    typeof record.occurredAt !== 'string' ||
    typeof record.id !== 'string'
  ) {
    throw new LedgerHistoryCursorError(INVALID_CURSOR);
  }
  if (record.workspaceId !== scope.workspaceId || record.paperAccountId !== scope.paperAccountId) {
    throw new LedgerHistoryCursorError(SCOPE_MISMATCH);
  }
  try {
    return {
      occurredAt: canonicalUtcTimestamp(record.occurredAt),
      id: requiredId(record.id),
    };
  } catch {
    throw new LedgerHistoryCursorError(INVALID_CURSOR);
  }
}

/**
 * Strict successor under ascending `(occurredAt, id)`.
 * Canonical UTC timestamps sort in the same order as their `Date` values.
 */
export function isAfterLedgerHistoryPosition(
  row: LedgerHistoryPosition,
  cursor: LedgerHistoryPosition,
): boolean {
  if (row.occurredAt > cursor.occurredAt) return true;
  if (row.occurredAt < cursor.occurredAt) return false;
  return row.id > cursor.id;
}

function canonicalUtcTimestamp(value: string): string {
  if (Number.isNaN(Date.parse(value)) || new Date(value).toISOString() !== value) {
    throw new LedgerHistoryCursorError(INVALID_CURSOR);
  }
  return value;
}

function requiredId(value: string): string {
  const id = value.trim();
  if (id === '') throw new LedgerHistoryCursorError(INVALID_CURSOR);
  return id;
}
