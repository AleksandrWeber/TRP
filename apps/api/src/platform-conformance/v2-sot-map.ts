/**
 * RC-28 Epic 3 — unique Source of Truth map for Version 2 business concepts.
 *
 * Records already-approved owners. Does not transfer ownership.
 */

import { V2_EXTERNAL_SOLE_OWNERS } from './v2-ownership-graph';
import type { V2PlatformModuleId } from './v2-platform-modules';

export type V2BusinessOwner =
  V2PlatformModuleId | (typeof V2_EXTERNAL_SOLE_OWNERS)[keyof typeof V2_EXTERNAL_SOLE_OWNERS];

export type V2SotRecord = Readonly<{
  concept: string;
  owner: V2BusinessOwner;
  authorityClass: string;
  isTradingFinanceSoT: boolean;
}>;

/**
 * Exactly one owner per concept. Trading/finance SoT stays on Freeze modules.
 */
export const V2_SOT_MAP: readonly V2SotRecord[] = Object.freeze([
  Object.freeze({
    concept: 'order-lifecycle',
    owner: 'orders',
    authorityClass: 'source_of_truth',
    isTradingFinanceSoT: true,
  }),
  Object.freeze({
    concept: 'risk-decision',
    owner: 'risk-engine',
    authorityClass: 'source_of_truth',
    isTradingFinanceSoT: true,
  }),
  Object.freeze({
    concept: 'execution-submit',
    owner: 'execution-engine',
    authorityClass: 'source_of_truth',
    isTradingFinanceSoT: true,
  }),
  Object.freeze({
    concept: 'fill-facts',
    owner: 'execution-engine',
    authorityClass: 'source_of_truth',
    isTradingFinanceSoT: true,
  }),
  Object.freeze({
    concept: 'positions',
    owner: 'accounting',
    authorityClass: 'source_of_truth',
    isTradingFinanceSoT: true,
  }),
  Object.freeze({
    concept: 'cash-ledger',
    owner: 'accounting',
    authorityClass: 'source_of_truth',
    isTradingFinanceSoT: true,
  }),
  Object.freeze({
    concept: 'trading-session-lifecycle',
    owner: 'trading-session',
    authorityClass: 'source_of_truth',
    isTradingFinanceSoT: true,
  }),
  Object.freeze({
    concept: 'certified-strategy-lifecycle',
    owner: 'strategy-library',
    authorityClass: 'source_of_truth',
    isTradingFinanceSoT: false,
  }),
  Object.freeze({
    concept: 'tactical-envelope-binding',
    owner: 'strategy-library',
    authorityClass: 'source_of_truth',
    isTradingFinanceSoT: false,
  }),
  Object.freeze({
    concept: 'enforcement-pass-fail',
    owner: 'runtime-enforcement',
    authorityClass: 'gate',
    isTradingFinanceSoT: false,
  }),
  Object.freeze({
    concept: 'qualification-run',
    owner: 'market-qualification',
    authorityClass: 'research_artifact',
    isTradingFinanceSoT: false,
  }),
  Object.freeze({
    concept: 'market-profile-versions',
    owner: 'market-profile',
    authorityClass: 'research_artifact',
    isTradingFinanceSoT: false,
  }),
  Object.freeze({
    concept: 'current-state-snapshot',
    owner: 'market-state',
    authorityClass: 'market_state_artifact',
    isTradingFinanceSoT: false,
  }),
  Object.freeze({
    concept: 'orchestration-run',
    owner: 'trading-orchestrator',
    authorityClass: 'orchestration_artifact',
    isTradingFinanceSoT: false,
  }),
  Object.freeze({
    concept: 'exchange-scope-identity',
    owner: 'exchange-scope',
    authorityClass: 'exchange_scope_artifact',
    isTradingFinanceSoT: false,
  }),
  Object.freeze({
    concept: 'exchange-risk-policy-inputs',
    owner: 'exchange-scope',
    authorityClass: 'policy_input',
    isTradingFinanceSoT: false,
  }),
  Object.freeze({
    concept: 'analytical-warehouse',
    owner: 'knowledge-lake',
    authorityClass: 'projection',
    isTradingFinanceSoT: false,
  }),
  Object.freeze({
    concept: 'report-generation',
    owner: 'reporting',
    authorityClass: 'projection',
    isTradingFinanceSoT: false,
  }),
  Object.freeze({
    concept: 'analytical-narrative',
    owner: 'ai-analytics',
    authorityClass: 'narrative',
    isTradingFinanceSoT: false,
  }),
  Object.freeze({
    concept: 'notification-delivery',
    owner: 'notification-delivery',
    authorityClass: 'notification-projection',
    isTradingFinanceSoT: false,
  }),
  Object.freeze({
    concept: 'ops-command-entry',
    owner: 'command-center',
    authorityClass: 'command_ui_projection',
    isTradingFinanceSoT: false,
  }),
]);

/** DoD disjoint owners — none of these may collapse into another. */
export const V2_DISJOINT_OWNERS = Object.freeze([
  'strategy-library',
  'runtime-enforcement',
  'trading-session',
  'trading-orchestrator',
  'risk-engine',
  'execution-engine',
  'accounting',
  'knowledge-lake',
  'reporting',
  'ai-analytics',
  'notification-delivery',
  'command-center',
  'exchange-scope',
] as const);

export function duplicateSotConcepts(rows: readonly V2SotRecord[] = V2_SOT_MAP): string[] {
  const seen = new Map<string, V2BusinessOwner>();
  const duplicates: string[] = [];
  for (const row of rows) {
    const existing = seen.get(row.concept);
    if (existing && existing !== row.owner) duplicates.push(row.concept);
    else seen.set(row.concept, row.owner);
  }
  return duplicates;
}

export function sotOwnerOf(concept: string): V2BusinessOwner | undefined {
  return V2_SOT_MAP.find((row) => row.concept === concept)?.owner;
}

export function tradingFinanceOwners(): readonly V2BusinessOwner[] {
  return [...new Set(V2_SOT_MAP.filter((row) => row.isTradingFinanceSoT).map((row) => row.owner))];
}
