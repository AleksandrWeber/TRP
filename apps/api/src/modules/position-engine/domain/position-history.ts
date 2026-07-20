import { FinancialDecimal } from '../../financial';
import { assertPositionHistoryAction, type PositionHistoryAction } from './position-history-action';

/**
 * Immutable position history entry (US205).
 */
export type PositionHistory = Readonly<{
  id: string;
  positionId: string;
  timestamp: string;
  action: PositionHistoryAction;
  quantity: string;
  price: string;
  realizedPnL: string;
}>;

export type CreatePositionHistoryInput = Readonly<{
  id: string;
  positionId: string;
  timestamp: string;
  action: PositionHistoryAction | string;
  quantity: string;
  price: string;
  realizedPnL: string;
}>;

export function createPositionHistory(input: CreatePositionHistoryInput): PositionHistory {
  const id = required(input.id, 'history id');
  const positionId = required(input.positionId, 'position id');
  assertIso(input.timestamp, 'timestamp');
  const quantity = FinancialDecimal.from(input.quantity).assertNonNegative('quantity').toString();
  const price = FinancialDecimal.from(input.price).assertPositive('price').toString();
  const realizedPnL = FinancialDecimal.from(input.realizedPnL).toString();

  return Object.freeze({
    id,
    positionId,
    timestamp: input.timestamp,
    action: assertPositionHistoryAction(input.action),
    quantity,
    price,
    realizedPnL,
  });
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
