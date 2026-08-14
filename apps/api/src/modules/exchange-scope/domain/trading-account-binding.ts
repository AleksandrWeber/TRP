/**
 * RC-27 Epic 2 — TradingAccountBinding (immutable account↔scope relationship).
 *
 * Task alias: ExchangeAccountBinding.
 * Binding only — no auth workflow, no API communication, no secrets.
 */

import {
  EXCHANGE_SCOPE_DOMAIN_AUTHORITY_CLASS,
  assertIsoTimestamp,
  assertNonEmptyString,
  deepFreeze,
} from './exchange-scope-domain-shared';

export const TRADING_ACCOUNT_BINDING_STATUSES = Object.freeze(['bound', 'unbound'] as const);

export type TradingAccountBindingStatus = (typeof TRADING_ACCOUNT_BINDING_STATUSES)[number];

export type TradingAccountBinding = Readonly<{
  tradingAccountBindingId: string;
  workspaceId: string;
  exchangeScopeId: string;
  tradingAccountId: string;
  status: TradingAccountBindingStatus;
  boundAt: string;
  boundBy: string;
  authorityClass: typeof EXCHANGE_SCOPE_DOMAIN_AUTHORITY_CLASS;
  ownsLedger: false;
  movesBalances: false;
  mutable: false;
}>;

export type CreateTradingAccountBindingInput = Readonly<{
  tradingAccountBindingId: string;
  workspaceId: string;
  exchangeScopeId: string;
  tradingAccountId: string;
  status?: string;
  boundAt: string;
  boundBy: string;
}>;

function assertBindingStatus(value: string): TradingAccountBindingStatus {
  if (!(TRADING_ACCOUNT_BINDING_STATUSES as readonly string[]).includes(value)) {
    throw new Error(`status must be a known TradingAccountBindingStatus`);
  }
  return value as TradingAccountBindingStatus;
}

/**
 * Create an immutable account binding.
 * Does not authenticate, call exchange APIs, or manage secrets.
 */
export function createTradingAccountBinding(
  input: CreateTradingAccountBindingInput,
): TradingAccountBinding {
  return deepFreeze({
    tradingAccountBindingId: assertNonEmptyString(
      input.tradingAccountBindingId,
      'tradingAccountBindingId',
    ),
    workspaceId: assertNonEmptyString(input.workspaceId, 'workspaceId'),
    exchangeScopeId: assertNonEmptyString(input.exchangeScopeId, 'exchangeScopeId'),
    tradingAccountId: assertNonEmptyString(input.tradingAccountId, 'tradingAccountId'),
    status: assertBindingStatus(input.status ?? 'bound'),
    boundAt: assertIsoTimestamp(input.boundAt, 'boundAt'),
    boundBy: assertNonEmptyString(input.boundBy, 'boundBy'),
    authorityClass: EXCHANGE_SCOPE_DOMAIN_AUTHORITY_CLASS,
    ownsLedger: false as const,
    movesBalances: false as const,
    mutable: false as const,
  });
}

/**
 * Produce a new unbound binding record (append-only revoke). Does not mutate `current`.
 */
export function unbindTradingAccount(
  current: TradingAccountBinding,
  unboundAt: string,
  unboundBy: string,
): TradingAccountBinding {
  if (current.status === 'unbound') {
    throw new Error('trading account binding is already unbound');
  }
  return createTradingAccountBinding({
    tradingAccountBindingId: current.tradingAccountBindingId,
    workspaceId: current.workspaceId,
    exchangeScopeId: current.exchangeScopeId,
    tradingAccountId: current.tradingAccountId,
    status: 'unbound',
    boundAt: unboundAt,
    boundBy: unboundBy,
  });
}

/** Product / task alias for TradingAccountBinding. */
export type ExchangeAccountBinding = TradingAccountBinding;
export const createExchangeAccountBinding = createTradingAccountBinding;
export const unbindExchangeAccount = unbindTradingAccount;
