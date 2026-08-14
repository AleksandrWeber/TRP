/**
 * RC-27 Epic 2 — AdapterBindingContext (logical adapter binding).
 *
 * Not a transport product. Not an Execution Engine.
 * No wire protocol / credentials / API communication.
 */

import {
  EXCHANGE_SCOPE_DOMAIN_AUTHORITY_CLASS,
  assertIsoTimestamp,
  assertNonEmptyString,
  deepFreeze,
  isExchangeScopeModeContext,
  type ExchangeScopeModeContext,
} from './exchange-scope-domain-shared';

export const ADAPTER_BINDING_CONTEXT_STATUSES = Object.freeze(['configured', 'cleared'] as const);

export type AdapterBindingContextStatus = (typeof ADAPTER_BINDING_CONTEXT_STATUSES)[number];

export type AdapterBindingContext = Readonly<{
  adapterBindingContextId: string;
  workspaceId: string;
  exchangeScopeId: string;
  adapterIdentity: string;
  modeContext: ExchangeScopeModeContext;
  status: AdapterBindingContextStatus;
  updatedAt: string;
  updatedBy: string;
  authorityClass: typeof EXCHANGE_SCOPE_DOMAIN_AUTHORITY_CLASS;
  isExecutionEngine: false;
  submitsOrders: false;
  definesWireProtocol: false;
  mutable: false;
}>;

export type CreateAdapterBindingContextInput = Readonly<{
  adapterBindingContextId: string;
  workspaceId: string;
  exchangeScopeId: string;
  adapterIdentity: string;
  modeContext: string;
  status?: string;
  updatedAt: string;
  updatedBy: string;
}>;

function assertAdapterStatus(value: string): AdapterBindingContextStatus {
  if (!(ADAPTER_BINDING_CONTEXT_STATUSES as readonly string[]).includes(value)) {
    throw new Error(`status must be a known AdapterBindingContextStatus`);
  }
  return value as AdapterBindingContextStatus;
}

/**
 * Create an immutable logical adapter binding context.
 * Does not define wire protocol, hold secrets, or submit orders.
 */
export function createAdapterBindingContext(
  input: CreateAdapterBindingContextInput,
): AdapterBindingContext {
  const modeRaw = assertNonEmptyString(input.modeContext, 'modeContext');
  if (!isExchangeScopeModeContext(modeRaw)) {
    throw new Error(`modeContext must be a known ExchangeScopeModeContext`);
  }

  return deepFreeze({
    adapterBindingContextId: assertNonEmptyString(
      input.adapterBindingContextId,
      'adapterBindingContextId',
    ),
    workspaceId: assertNonEmptyString(input.workspaceId, 'workspaceId'),
    exchangeScopeId: assertNonEmptyString(input.exchangeScopeId, 'exchangeScopeId'),
    adapterIdentity: assertNonEmptyString(input.adapterIdentity, 'adapterIdentity'),
    modeContext: modeRaw,
    status: assertAdapterStatus(input.status ?? 'configured'),
    updatedAt: assertIsoTimestamp(input.updatedAt, 'updatedAt'),
    updatedBy: assertNonEmptyString(input.updatedBy, 'updatedBy'),
    authorityClass: EXCHANGE_SCOPE_DOMAIN_AUTHORITY_CLASS,
    isExecutionEngine: false as const,
    submitsOrders: false as const,
    definesWireProtocol: false as const,
    mutable: false as const,
  });
}
