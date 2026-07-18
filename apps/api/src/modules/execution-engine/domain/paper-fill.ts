import { createHash } from 'node:crypto';
import { FinancialDecimal } from '../../financial';
import type { PaperFillFact } from '../../execution-adapter';

export const PAPER_FILL_SCHEMA_VERSION = 1;

export type PaperFillSide = 'buy' | 'sell';

/**
 * Immutable, append-only paper Fill fact (US171 / ADR-015).
 * Every Fill references exactly one persisted Order and carries the versioned
 * execution context that produced it. Financial values remain canonical
 * decimal strings; the Fill owns no lifecycle and is never mutated.
 */
export type PaperFill = Readonly<{
  id: string;
  workspaceId: string;
  orderId: string;
  paperAccountId: string;
  tradingSessionId: string;
  adapterOrderId: string;
  adapterFillId: string;
  sequence: number;
  instrument: string;
  side: PaperFillSide;
  price: string;
  quantity: string;
  grossNotional: string;
  fee: string;
  executionContextHash: string;
  configurationId: string;
  configurationVersion: number;
  configurationHash: string;
  occurredAt: string;
  recordedAt: string;
}>;

export type CreatePaperFillInput = Readonly<{
  workspaceId: string;
  orderId: string;
  paperAccountId: string;
  tradingSessionId: string;
  adapterOrderId: string;
  executionContextHash: string;
  configurationId: string;
  configurationVersion: number;
  configurationHash: string;
  fact: PaperFillFact;
  recordedAt: string;
}>;

export function createPaperFill(input: CreatePaperFillInput): PaperFill {
  const workspaceId = required(input.workspaceId, 'workspace id');
  const orderId = required(input.orderId, 'order id');
  const paperAccountId = required(input.paperAccountId, 'paper account id');
  const tradingSessionId = required(input.tradingSessionId, 'trading session id');
  const adapterOrderId = required(input.adapterOrderId, 'adapter order id');
  const executionContextHash = required(input.executionContextHash, 'execution context hash');
  const adapterFillId = required(input.fact.adapterFillId, 'adapter fill id');
  if (!Number.isSafeInteger(input.fact.sequence) || input.fact.sequence < 1) {
    throw new Error('fill sequence must be a positive integer');
  }
  const price = FinancialDecimal.from(input.fact.price).assertPositive('fill price');
  const quantity = FinancialDecimal.from(input.fact.quantity).assertPositive('fill quantity');
  const grossNotional = FinancialDecimal.from(input.fact.grossNotional).assertPositive(
    'fill gross notional',
  );
  const fee = FinancialDecimal.from(input.fact.fee).assertNonNegative('fill fee');
  assertIso(input.fact.occurredAt, 'occurredAt');
  assertIso(input.recordedAt, 'recordedAt');

  const id = deterministicFillIdentity(workspaceId, orderId, adapterFillId);
  return Object.freeze({
    id,
    workspaceId,
    orderId,
    paperAccountId,
    tradingSessionId,
    adapterOrderId,
    adapterFillId,
    sequence: input.fact.sequence,
    instrument: required(input.fact.instrument, 'instrument'),
    side: input.fact.side,
    price: price.toString(),
    quantity: quantity.toString(),
    grossNotional: grossNotional.toString(),
    fee: fee.toString(),
    executionContextHash,
    configurationId: required(input.configurationId, 'configuration id'),
    configurationVersion: input.configurationVersion,
    configurationHash: required(input.configurationHash, 'configuration hash'),
    occurredAt: input.fact.occurredAt,
    recordedAt: input.recordedAt,
  });
}

/**
 * Stable Fill identity so a replayed adapter result maps to the same row and
 * cannot append a duplicate Fill.
 */
export function deterministicFillIdentity(
  workspaceId: string,
  orderId: string,
  adapterFillId: string,
): string {
  const hash = createHash('sha256')
    .update(`${workspaceId}:${orderId}:${adapterFillId}`)
    .digest('hex')
    .slice(0, 32);
  return `fil_${hash}`;
}

function required(value: string, label: string): string {
  const result = value.trim();
  if (result === '') throw new Error(`${label} is required`);
  return result;
}

function assertIso(value: string, label: string): void {
  if (Number.isNaN(Date.parse(value)) || new Date(value).toISOString() !== value) {
    throw new Error(`${label} must be an ISO-8601 UTC timestamp`);
  }
}
