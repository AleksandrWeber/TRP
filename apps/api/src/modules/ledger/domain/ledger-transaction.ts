import { createHash } from 'node:crypto';
import { FinancialDecimal } from '../../financial';

export const LEDGER_TRANSACTION_SCHEMA_VERSION = 1;

export enum LedgerAccount {
  AVAILABLE_CASH = 'available_cash',
  RESERVED_CASH = 'reserved_cash',
  POSITION_COST = 'position_cost',
  FEES = 'fees',
  REALIZED_PNL = 'realized_pnl',
  ADJUSTMENT_COMPENSATION = 'adjustment_compensation',
}

export enum LedgerDirection {
  DEBIT = 'debit',
  CREDIT = 'credit',
}

export enum LedgerCauseType {
  OPENING_CAPITAL = 'opening_capital',
  RESERVATION = 'reservation',
  RESERVATION_RELEASE = 'reservation_release',
  FILL = 'fill',
  COMPENSATION = 'compensation',
}

export type LedgerEntry = Readonly<{
  id: string;
  transactionId: string;
  workspaceId: string;
  line: number;
  account: LedgerAccount;
  direction: LedgerDirection;
  amount: string;
}>;

export type LedgerTransaction = Readonly<{
  id: string;
  workspaceId: string;
  paperAccountId: string;
  idempotencyKey: string;
  causeType: LedgerCauseType;
  causeId: string;
  currency: string;
  occurredAt: string;
  recordedAt: string;
  actorId: string;
  correlationId: string | null;
  compensationReason: string | null;
  entries: ReadonlyArray<LedgerEntry>;
}>;

export type CreateLedgerTransactionInput = Readonly<{
  workspaceId: string;
  paperAccountId: string;
  idempotencyKey: string;
  causeType: LedgerCauseType;
  causeId: string;
  currency: string;
  occurredAt: string;
  recordedAt: string;
  actorId: string;
  correlationId?: string;
  compensationReason?: string;
  entries: ReadonlyArray<
    Readonly<{
      account: LedgerAccount;
      direction: LedgerDirection;
      amount: string;
    }>
  >;
}>;

/**
 * Creates one immutable balanced Ledger transaction (US173 / ADR-015).
 * Historical entries have no mutation API; corrections are new compensation
 * transactions with a mandatory reason.
 */
export function createLedgerTransaction(input: CreateLedgerTransactionInput): LedgerTransaction {
  const workspaceId = required(input.workspaceId, 'workspace id');
  const paperAccountId = required(input.paperAccountId, 'paper account id');
  const idempotencyKey = required(input.idempotencyKey, 'idempotency key');
  const causeId = required(input.causeId, 'cause id');
  const currency = required(input.currency, 'currency').toUpperCase();
  const actorId = required(input.actorId, 'actor id');
  assertIso(input.occurredAt, 'occurredAt');
  assertIso(input.recordedAt, 'recordedAt');
  if (!Object.values(LedgerCauseType).includes(input.causeType)) {
    throw new Error('unsupported Ledger cause type');
  }
  const compensationReason =
    input.causeType === LedgerCauseType.COMPENSATION
      ? required(input.compensationReason ?? '', 'compensation reason')
      : null;
  if (input.entries.length < 2) {
    throw new Error('Ledger transaction requires at least two entries');
  }

  const transactionId = ledgerTransactionId(workspaceId, idempotencyKey);
  let debits = FinancialDecimal.zero();
  let credits = FinancialDecimal.zero();
  const entries = Object.freeze(
    input.entries.map((entry, index) => {
      if (!Object.values(LedgerAccount).includes(entry.account)) {
        throw new Error('unsupported Ledger account');
      }
      if (!Object.values(LedgerDirection).includes(entry.direction)) {
        throw new Error('unsupported Ledger direction');
      }
      const amount = FinancialDecimal.from(entry.amount).assertPositive('Ledger entry amount');
      if (entry.direction === LedgerDirection.DEBIT) debits = debits.plus(amount);
      else credits = credits.plus(amount);
      const line = index + 1;
      return Object.freeze({
        id: `${transactionId}:${line}`,
        transactionId,
        workspaceId,
        line,
        account: entry.account,
        direction: entry.direction,
        amount: amount.toString(),
      });
    }),
  );
  if (!debits.equals(credits)) {
    throw new Error(
      `Ledger transaction is not balanced: debits=${debits.toString()} credits=${credits.toString()}`,
    );
  }

  return Object.freeze({
    id: transactionId,
    workspaceId,
    paperAccountId,
    idempotencyKey,
    causeType: input.causeType,
    causeId,
    currency,
    occurredAt: input.occurredAt,
    recordedAt: input.recordedAt,
    actorId,
    correlationId: optional(input.correlationId),
    compensationReason,
    entries,
  });
}

export function ledgerTransactionId(workspaceId: string, idempotencyKey: string): string {
  const hash = createHash('sha256')
    .update(`${workspaceId}:${idempotencyKey}`)
    .digest('hex')
    .slice(0, 32);
  return `ldg_${hash}`;
}

function required(value: string, label: string): string {
  const normalized = value.trim();
  if (normalized === '') throw new Error(`${label} is required`);
  return normalized;
}

function optional(value: string | undefined): string | null {
  const normalized = value?.trim();
  return normalized ? normalized : null;
}

function assertIso(value: string, label: string): void {
  if (Number.isNaN(Date.parse(value)) || new Date(value).toISOString() !== value) {
    throw new Error(`${label} must be an ISO-8601 UTC timestamp`);
  }
}
