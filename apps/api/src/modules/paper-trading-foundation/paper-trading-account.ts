/**
 * Paper Trading Foundation — Paper Account domain (W2-S04-a).
 *
 * Provider-independent. Never references exchange venues, REST, tickers,
 * candles, order books, or streaming. Balance is informational only.
 */

export const PAPER_TRADING_ACCOUNT_SCHEMA_VERSION = 1;

export const PAPER_ACCOUNT_STATUSES = ['NOT_CREATED', 'ACTIVE', 'DISABLED'] as const;
export type PaperAccountStatus = (typeof PAPER_ACCOUNT_STATUSES)[number];

export const PAPER_ACCOUNT_CURRENCIES = ['USD'] as const;
export type PaperAccountCurrency = (typeof PAPER_ACCOUNT_CURRENCIES)[number];

export const DEFAULT_PAPER_STARTING_BALANCE = '100000';

export type PaperTradingAccount = Readonly<{
  id: string;
  workspaceId: string;
  status: Exclude<PaperAccountStatus, 'NOT_CREATED'>;
  baseCurrency: PaperAccountCurrency;
  startingBalance: string;
  currentBalance: string;
  ownerId: string;
  createdAt: string;
  updatedAt: string;
}>;

export type CreatePaperTradingAccountInput = Readonly<{
  id: string;
  workspaceId: string;
  ownerId: string;
  baseCurrency?: string;
  startingBalance?: string;
  createdAt: string;
}>;

export function isPaperAccountStatus(value: string): value is PaperAccountStatus {
  return (PAPER_ACCOUNT_STATUSES as readonly string[]).includes(value);
}

export function isPaperAccountCurrency(value: string): value is PaperAccountCurrency {
  return (PAPER_ACCOUNT_CURRENCIES as readonly string[]).includes(value);
}

export function createPaperTradingAccount(
  input: CreatePaperTradingAccountInput,
): PaperTradingAccount {
  const id = required(input.id, 'paper account id');
  const workspaceId = required(input.workspaceId, 'workspace id');
  const ownerId = required(input.ownerId, 'owner');
  const baseCurrency = normalizeCurrency(input.baseCurrency ?? 'USD');
  const startingBalance = normalizeBalance(
    input.startingBalance ?? DEFAULT_PAPER_STARTING_BALANCE,
    'starting balance',
  );
  assertIso(input.createdAt, 'createdAt');

  return Object.freeze({
    id,
    workspaceId,
    status: 'ACTIVE',
    baseCurrency,
    startingBalance,
    currentBalance: startingBalance,
    ownerId,
    createdAt: input.createdAt,
    updatedAt: input.createdAt,
  });
}

export function disablePaperTradingAccount(
  account: PaperTradingAccount,
  updatedAt: string,
): PaperTradingAccount {
  if (account.status !== 'ACTIVE') {
    throw new Error(`paper account cannot disable from ${account.status}`);
  }
  assertIso(updatedAt, 'updatedAt');
  return Object.freeze({
    ...account,
    status: 'DISABLED',
    updatedAt,
  });
}

export function activatePaperTradingAccount(
  account: PaperTradingAccount,
  updatedAt: string,
): PaperTradingAccount {
  if (account.status !== 'DISABLED') {
    throw new Error(`paper account cannot activate from ${account.status}`);
  }
  assertIso(updatedAt, 'updatedAt');
  return Object.freeze({
    ...account,
    status: 'ACTIVE',
    updatedAt,
  });
}

function normalizeCurrency(value: string): PaperAccountCurrency {
  const currency = required(value, 'base currency').toUpperCase();
  if (!isPaperAccountCurrency(currency)) {
    throw new Error(`unsupported paper account currency: ${currency}`);
  }
  return currency;
}

function normalizeBalance(value: string, label: string): string {
  const trimmed = required(value, label);
  if (!/^(?:0|[1-9]\d*)(?:\.\d{1,8})?$/.test(trimmed)) {
    throw new Error(`${label} must be a non-negative decimal`);
  }
  const amount = Number(trimmed);
  if (!Number.isFinite(amount) || amount < 0) {
    throw new Error(`${label} must be a non-negative decimal`);
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
