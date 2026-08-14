/**
 * RC-28 Epic 3 — Alias Dictionary bindings observed in code.
 *
 * Does not edit docs/project/v2-alias-dictionary.md. Product language stays
 * bound to already-approved canonical owners.
 */

export const V2_ALIAS_BINDINGS = Object.freeze([
  Object.freeze({
    productTerm: 'Bot',
    canonical: 'Trading Session',
    evidence: 'BotFacadeService',
    secondAggregateForbidden: true,
  }),
  Object.freeze({
    productTerm: 'Cluster',
    canonical: 'Exchange Scope',
    evidence: 'EXCHANGE_SCOPE_UI_ALIAS',
    secondAggregateForbidden: true,
  }),
  Object.freeze({
    productTerm: 'Wallet',
    canonical: 'Trading Account',
    evidence: 'ledger remains Freeze Accounting',
    secondAggregateForbidden: true,
  }),
  Object.freeze({
    productTerm: 'Brain',
    canonical: 'Trading Orchestrator',
    evidence: 'TRADING_ORCHESTRATOR_MODULE_ID',
    secondAggregateForbidden: true,
  }),
]);

export const V2_ALIAS_DICTIONARY_PATH = '../../docs/project/v2-alias-dictionary.md';
export const V2_AUTHORITY_MATRIX_PATH = '../../docs/project/v2-authority-matrix.md';
export const V2_ISOLATION_INVARIANTS_PATH = '../../docs/project/v2-cluster-isolation-invariants.md';
export const V2_TACTICS_CONTRACT_PATH = '../../docs/project/v2-tactics-contract.md';
