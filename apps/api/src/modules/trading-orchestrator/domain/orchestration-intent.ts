/**
 * RC-26 Epic 4 — OrchestrationIntent (descriptive intent only).
 *
 * Does not select strategies, create Sessions, submit orders, or approve risk.
 */

import {
  TRADING_ORCHESTRATOR_DOMAIN_AUTHORITY_CLASS,
  assertNonEmptyString,
  deepFreeze,
} from './trading-orchestrator-domain-shared';

export type OrchestrationIntent = Readonly<{
  objective: string;
  rationaleSummary: string;
  authorityClass: typeof TRADING_ORCHESTRATOR_DOMAIN_AUTHORITY_CLASS;
  forcesTrade: false;
  selectsStrategy: false;
  selectsTactic: false;
  createsSession: false;
  submitsOrders: false;
  approvesRisk: false;
  executesActions: false;
  isWorkflow: false;
}>;

export type CreateOrchestrationIntentInput = Readonly<{
  objective: string;
  rationaleSummary: string;
}>;

/**
 * Create an immutable orchestration intent record.
 * Intent describes coordination purpose only — never executes actions.
 */
export function createOrchestrationIntent(
  input: CreateOrchestrationIntentInput,
): OrchestrationIntent {
  return deepFreeze({
    objective: assertNonEmptyString(input.objective, 'objective'),
    rationaleSummary: assertNonEmptyString(input.rationaleSummary, 'rationaleSummary'),
    authorityClass: TRADING_ORCHESTRATOR_DOMAIN_AUTHORITY_CLASS,
    forcesTrade: false as const,
    selectsStrategy: false as const,
    selectsTactic: false as const,
    createsSession: false as const,
    submitsOrders: false as const,
    approvesRisk: false as const,
    executesActions: false as const,
    isWorkflow: false as const,
  });
}
