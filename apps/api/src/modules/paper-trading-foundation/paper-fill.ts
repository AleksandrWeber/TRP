/**
 * Paper Fill domain (W2-S04-c).
 *
 * Local simulated execution based on Market Data. Not exchange acceptance.
 */

import type { PaperOrderSide } from './paper-order';

export type PaperFill = Readonly<{
  id: string;
  workspaceId: string;
  paperAccountId: string;
  paperOrderId: string;
  exchange: string;
  symbol: string;
  side: PaperOrderSide;
  quantity: string;
  executionPrice: string;
  executionTime: string;
  createdAt: string;
}>;

export type CreatePaperFillInput = Readonly<{
  id: string;
  workspaceId: string;
  paperAccountId: string;
  paperOrderId: string;
  exchange: string;
  symbol: string;
  side: PaperOrderSide;
  quantity: string;
  executionPrice: string;
  executionTime: string;
  createdAt: string;
}>;

export function createPaperFill(input: CreatePaperFillInput): PaperFill {
  const id = required(input.id, 'fill id');
  const workspaceId = required(input.workspaceId, 'workspace id');
  const paperAccountId = required(input.paperAccountId, 'paper account id');
  const paperOrderId = required(input.paperOrderId, 'paper order id');
  const exchange = required(input.exchange, 'exchange').toUpperCase();
  const symbol = required(input.symbol, 'symbol').toUpperCase();
  const quantity = normalizePositiveDecimal(input.quantity, 'quantity');
  const executionPrice = normalizePositiveDecimal(input.executionPrice, 'execution price');
  assertIso(input.executionTime, 'executionTime');
  assertIso(input.createdAt, 'createdAt');

  return Object.freeze({
    id,
    workspaceId,
    paperAccountId,
    paperOrderId,
    exchange,
    symbol,
    side: input.side,
    quantity,
    executionPrice,
    executionTime: input.executionTime,
    createdAt: input.createdAt,
  });
}

function normalizePositiveDecimal(value: string, label: string): string {
  const trimmed = required(value, label);
  if (!/^(?:0|[1-9]\d*)(?:\.\d{1,8})?$/.test(trimmed)) {
    throw new Error(`${label} must be a positive decimal`);
  }
  const amount = Number(trimmed);
  if (!Number.isFinite(amount) || amount <= 0) {
    throw new Error(`${label} must be a positive decimal`);
  }
  return trimmed;
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
