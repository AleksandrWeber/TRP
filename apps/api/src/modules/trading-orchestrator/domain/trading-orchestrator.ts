/**
 * RC-26 Epic 4 — TradingOrchestrator (immutable coordinator identity).
 *
 * Domain identity for the Trading Orchestrator context within a workspace.
 * Does not run workflows, select strategies, or own Market State / Library / Gate.
 */

import {
  TRADING_ORCHESTRATOR_DOMAIN_AUTHORITY_CLASS,
  assertIsoTimestamp,
  assertNonEmptyString,
  deepFreeze,
} from './trading-orchestrator-domain-shared';

export type TradingOrchestrator = Readonly<{
  tradingOrchestratorId: string;
  workspaceId: string;
  exchangeScopeId: string;
  displayName: string;
  createdAt: string;
  createdBy: string;
  authorityClass: typeof TRADING_ORCHESTRATOR_DOMAIN_AUTHORITY_CLASS;
  forcesTrade: false;
  isStrategyLibrary: false;
  isRuntimeEnforcement: false;
  isMarketQualification: false;
  isMarketProfile: false;
  isMarketState: false;
  isExecutionEngine: false;
  mutable: false;
}>;

export type CreateTradingOrchestratorInput = Readonly<{
  tradingOrchestratorId: string;
  workspaceId: string;
  exchangeScopeId: string;
  displayName: string;
  createdAt: string;
  createdBy: string;
}>;

/**
 * Create an immutable Trading Orchestrator identity record.
 * Identity only — no orchestration behaviour.
 */
export function createTradingOrchestrator(
  input: CreateTradingOrchestratorInput,
): TradingOrchestrator {
  return deepFreeze({
    tradingOrchestratorId: assertNonEmptyString(
      input.tradingOrchestratorId,
      'tradingOrchestratorId',
    ),
    workspaceId: assertNonEmptyString(input.workspaceId, 'workspaceId'),
    exchangeScopeId: assertNonEmptyString(input.exchangeScopeId, 'exchangeScopeId'),
    displayName: assertNonEmptyString(input.displayName, 'displayName'),
    createdAt: assertIsoTimestamp(input.createdAt, 'createdAt'),
    createdBy: assertNonEmptyString(input.createdBy, 'createdBy'),
    authorityClass: TRADING_ORCHESTRATOR_DOMAIN_AUTHORITY_CLASS,
    forcesTrade: false as const,
    isStrategyLibrary: false as const,
    isRuntimeEnforcement: false as const,
    isMarketQualification: false as const,
    isMarketProfile: false as const,
    isMarketState: false as const,
    isExecutionEngine: false as const,
    mutable: false as const,
  });
}
