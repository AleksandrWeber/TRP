import { FinancialDecimal } from '../../financial';

export const PAPER_ACCOUNT_SCHEMA_VERSION = 1;

export enum PaperAccountStatus {
  PENDING_OPENING_LEDGER = 'pending_opening_ledger',
  ACTIVE = 'active',
  SUSPENDED = 'suspended',
  CLOSED = 'closed',
}

export type PaperAccount = Readonly<{
  id: string;
  workspaceId: string;
  currency: string;
  mode: 'paper';
  status: PaperAccountStatus;
  /** Immutable funding instruction; Ledger becomes the cash authority in US173. */
  openingCapital: string;
  openingLedgerTransactionId: string | null;
  version: number;
  openedAt: string;
  recordedAt: string;
}>;

export type CreatePaperAccountInput = Readonly<{
  id: string;
  workspaceId: string;
  currency: string;
  mode: 'paper';
  openingCapital: string;
  openedAt: string;
  recordedAt: string;
}>;

export function createPaperAccount(input: CreatePaperAccountInput): PaperAccount {
  const id = required(input.id, 'paper account id');
  const workspaceId = required(input.workspaceId, 'workspace id');
  if (input.mode !== 'paper') throw new Error('paper account mode must be paper');
  const currency = normalizeCurrency(input.currency);
  const openingCapital = FinancialDecimal.from(input.openingCapital)
    .assertPositive('opening capital')
    .toString();
  assertOpeningCapitalStoragePrecision(openingCapital);
  assertIso(input.openedAt, 'openedAt');
  assertIso(input.recordedAt, 'recordedAt');

  return Object.freeze({
    id,
    workspaceId,
    currency,
    mode: 'paper',
    status: PaperAccountStatus.PENDING_OPENING_LEDGER,
    openingCapital,
    openingLedgerTransactionId: null,
    version: 1,
    openedAt: input.openedAt,
    recordedAt: input.recordedAt,
  });
}

export function activatePaperAccount(
  account: PaperAccount,
  openingLedgerTransactionId: string,
  recordedAt: string,
): PaperAccount {
  if (account.status !== PaperAccountStatus.PENDING_OPENING_LEDGER) {
    throw new Error(`paper account cannot activate from ${account.status}`);
  }
  assertIso(recordedAt, 'recordedAt');
  return Object.freeze({
    ...account,
    status: PaperAccountStatus.ACTIVE,
    openingLedgerTransactionId: required(
      openingLedgerTransactionId,
      'opening ledger transaction id',
    ),
    version: account.version + 1,
    recordedAt,
  });
}

export function suspendPaperAccount(account: PaperAccount, recordedAt: string): PaperAccount {
  if (account.status !== PaperAccountStatus.ACTIVE) {
    throw new Error(`paper account cannot suspend from ${account.status}`);
  }
  assertIso(recordedAt, 'recordedAt');
  return Object.freeze({
    ...account,
    status: PaperAccountStatus.SUSPENDED,
    version: account.version + 1,
    recordedAt,
  });
}

export function closePaperAccount(account: PaperAccount, recordedAt: string): PaperAccount {
  if (account.status === PaperAccountStatus.CLOSED) {
    throw new Error('paper account is already closed');
  }
  assertIso(recordedAt, 'recordedAt');
  return Object.freeze({
    ...account,
    status: PaperAccountStatus.CLOSED,
    version: account.version + 1,
    recordedAt,
  });
}

function normalizeCurrency(value: string): string {
  const currency = required(value, 'paper account currency').toUpperCase();
  if (!/^[A-Z0-9]{3,12}$/.test(currency)) {
    throw new Error('paper account currency must be 3-12 uppercase letters or digits');
  }
  return currency;
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

function assertOpeningCapitalStoragePrecision(value: string): void {
  const [integer, fraction = ''] = value.split('.');
  if (integer.length > 20 || fraction.length > 18) {
    throw new Error('opening capital exceeds DECIMAL(38,18) storage precision');
  }
}
