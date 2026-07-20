import { FinancialDecimal } from '../../financial';

/**
 * Immutable paper trade execution record (US208).
 */
export type PaperExecution = Readonly<{
  id: string;
  sessionId: string;
  orderId: string;
  executionTime: string;
  executionPrice: string;
  slippage: string;
  commission: string;
}>;

export type CreatePaperExecutionInput = Readonly<{
  id: string;
  sessionId: string;
  orderId: string;
  executionTime: string;
  executionPrice: string;
  slippage: string;
  commission: string;
}>;

export function createPaperExecution(input: CreatePaperExecutionInput): PaperExecution {
  assertIso(input.executionTime, 'executionTime');
  return Object.freeze({
    id: required(input.id, 'execution id'),
    sessionId: required(input.sessionId, 'session id'),
    orderId: required(input.orderId, 'order id'),
    executionTime: input.executionTime,
    executionPrice: FinancialDecimal.from(input.executionPrice)
      .assertNonNegative('executionPrice')
      .toString(),
    slippage: FinancialDecimal.from(input.slippage).toString(),
    commission: FinancialDecimal.from(input.commission).assertNonNegative('commission').toString(),
  });
}

export function rehydratePaperExecution(row: {
  id: string;
  sessionId: string;
  orderId: string;
  executionTime: string;
  executionPrice: string;
  slippage: string;
  commission: string;
}): PaperExecution {
  return createPaperExecution(row);
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
