/**
 * RC-26 Epic 4 — Trading Orchestrator domain model specs.
 *
 * Immutable entities, lifecycle edges, plan version history, overwrite protection.
 * No workflow / selection / Session behaviour.
 */

import { describe, expect, it } from 'vitest';
import { createOrchestrationIntent } from './orchestration-intent';
import {
  createOrchestrationLifecycle,
  transitionOrchestrationLifecycle,
} from './orchestration-lifecycle';
import { createOrchestrationMetadata } from './orchestration-metadata';
import {
  createOrchestrationPlan,
  publishNextOrchestrationPlan,
  withOrchestrationPlanLifecycle,
} from './orchestration-plan';
import {
  assertNoPlanVersionOverwrite,
  createOrchestrationPlanVersion,
} from './orchestration-plan-version';
import { createTradingOrchestrator } from './trading-orchestrator';
import {
  ORCHESTRATION_LIFECYCLE_TRANSITIONS,
  TRADING_ORCHESTRATOR_DOMAIN_AUTHORITY_CLASS,
  canTransitionOrchestrationLifecycle,
} from './trading-orchestrator-domain-shared';

const baseIntent = {
  objective: 'coordinate certified strategy application under current conditions',
  rationaleSummary: 'descriptive intent only',
};

const baseMetadata = {
  asOf: '2026-08-10T12:00:00.000Z',
  marketStateRef: 'ms-1',
  inputSummary: 'opaque refs to state/qual/profile',
};

function createPlanV1(overrides?: Partial<Parameters<typeof createOrchestrationPlan>[0]>) {
  return createOrchestrationPlan({
    orchestrationPlanId: 'plan-1',
    tradingOrchestratorId: 'orch-1',
    workspaceId: 'ws-1',
    exchangeScopeId: 'binance',
    marketSymbol: 'BTCUSDT',
    modeContext: 'paper',
    version: {
      orchestrationPlanId: 'plan-1',
      version: 1,
      publishedAt: '2026-08-10T12:00:00.000Z',
      publishedBy: 'operator-1',
    },
    lifecycle: {
      status: 'created',
      updatedAt: '2026-08-10T12:00:00.000Z',
      updatedBy: 'operator-1',
      reason: 'initial',
    },
    intent: baseIntent,
    metadata: baseMetadata,
    ...overrides,
  });
}

describe('RC-26 Epic 4 — Trading Orchestrator domain model', () => {
  it('creates immutable TradingOrchestrator identity that is not Library/Gate/State/Execution', () => {
    const orch = createTradingOrchestrator({
      tradingOrchestratorId: 'orch-1',
      workspaceId: 'ws-1',
      exchangeScopeId: 'binance',
      displayName: 'Paper Orchestrator',
      createdAt: '2026-08-10T12:00:00.000Z',
      createdBy: 'op',
    });
    expect(Object.isFrozen(orch)).toBe(true);
    expect(orch.authorityClass).toBe(TRADING_ORCHESTRATOR_DOMAIN_AUTHORITY_CLASS);
    expect(orch.isStrategyLibrary).toBe(false);
    expect(orch.isRuntimeEnforcement).toBe(false);
    expect(orch.isMarketState).toBe(false);
    expect(orch.isMarketQualification).toBe(false);
    expect(orch.isMarketProfile).toBe(false);
    expect(orch.isExecutionEngine).toBe(false);
    expect(orch.mutable).toBe(false);
  });

  it('creates immutable Intent / Lifecycle / Metadata / PlanVersion', () => {
    const intent = createOrchestrationIntent(baseIntent);
    const lifecycle = createOrchestrationLifecycle({
      status: 'created',
      updatedAt: '2026-08-10T12:00:00.000Z',
      updatedBy: 'op',
      reason: 'init',
    });
    const metadata = createOrchestrationMetadata(baseMetadata);
    const version = createOrchestrationPlanVersion({
      orchestrationPlanId: 'plan-1',
      version: 1,
      publishedAt: '2026-08-10T12:00:00.000Z',
      publishedBy: 'op',
    });

    expect(Object.isFrozen(intent)).toBe(true);
    expect(intent.selectsStrategy).toBe(false);
    expect(intent.createsSession).toBe(false);
    expect(intent.executesActions).toBe(false);
    expect(intent.isWorkflow).toBe(false);
    expect(lifecycle.authorizesRuntime).toBe(false);
    expect(metadata.ownsLibrary).toBe(false);
    expect(metadata.ownsMarketState).toBe(false);
    expect(version.mutable).toBe(false);
  });

  it('creates immutable OrchestrationPlan aggregate', () => {
    const plan = createPlanV1();
    expect(Object.isFrozen(plan)).toBe(true);
    expect(plan.authorityClass).toBe(TRADING_ORCHESTRATOR_DOMAIN_AUTHORITY_CLASS);
    expect(plan.modeContext).toBe('paper');
    expect(plan.executesActions).toBe(false);
    expect(plan.selectsStrategy).toBe(false);
    expect(plan.createsSession).toBe(false);
    expect(plan.isWorkflow).toBe(false);
    expect(plan.mutable).toBe(false);
  });

  it('rejects unknown mode / lifecycle and mismatched version identity', () => {
    expect(() => createPlanV1({ modeContext: 'shadow' })).toThrow(/known OrchestrationModeContext/);
    expect(() =>
      createOrchestrationLifecycle({
        status: 'running',
        updatedAt: '2026-08-10T12:00:00.000Z',
        updatedBy: 'op',
        reason: 'x',
      }),
    ).toThrow(/known OrchestrationLifecycleStatus/);
    expect(() =>
      createPlanV1({
        version: {
          orchestrationPlanId: 'other',
          version: 1,
          publishedAt: '2026-08-10T12:00:00.000Z',
          publishedBy: 'op',
        },
      }),
    ).toThrow(/version.orchestrationPlanId must match/);
  });

  it('enforces Created → Planned → Ready → Cancelled|Archived edges only', () => {
    expect(canTransitionOrchestrationLifecycle('created', 'planned')).toBe(true);
    expect(canTransitionOrchestrationLifecycle('planned', 'ready')).toBe(true);
    expect(canTransitionOrchestrationLifecycle('ready', 'archived')).toBe(true);
    expect(canTransitionOrchestrationLifecycle('ready', 'planned')).toBe(false);
    expect(canTransitionOrchestrationLifecycle('archived', 'ready')).toBe(false);
    expect(ORCHESTRATION_LIFECYCLE_TRANSITIONS.archived).toEqual([]);

    const created = createOrchestrationLifecycle({
      status: 'created',
      updatedAt: '2026-08-10T12:00:00.000Z',
      updatedBy: 'op',
      reason: 'init',
    });
    const planned = transitionOrchestrationLifecycle(
      created,
      'planned',
      '2026-08-10T12:01:00.000Z',
      'op',
      'plan',
    );
    expect(planned.status).toBe('planned');
    expect(created.status).toBe('created');
    expect(() =>
      transitionOrchestrationLifecycle(created, 'ready', '2026-08-10T12:02:00.000Z', 'op', 'bad'),
    ).toThrow(/forbidden Orchestration lifecycle transition/);
  });

  it('withOrchestrationPlanLifecycle returns a new immutable plan', () => {
    const created = createPlanV1();
    const planned = withOrchestrationPlanLifecycle(
      created,
      'planned',
      '2026-08-10T12:05:00.000Z',
      'op',
      'plan',
    );
    expect(created.lifecycle.status).toBe('created');
    expect(planned.lifecycle.status).toBe('planned');
    expect(Object.isFrozen(planned)).toBe(true);
  });

  it('publishNextOrchestrationPlan appends versions and archives prior ready (no overwrite)', () => {
    const first = publishNextOrchestrationPlan({
      history: [],
      next: {
        orchestrationPlanId: 'plan-1',
        tradingOrchestratorId: 'orch-1',
        workspaceId: 'ws-1',
        exchangeScopeId: 'binance',
        marketSymbol: 'BTCUSDT',
        modeContext: 'paper',
        versionNumber: 1,
        publishedAt: '2026-08-10T12:00:00.000Z',
        publishedBy: 'op',
        intent: baseIntent,
        metadata: baseMetadata,
      },
    });
    expect(first.previous).toBeNull();
    expect(first.next.lifecycle.status).toBe('ready');
    expect(first.next.version.version).toBe(1);

    const second = publishNextOrchestrationPlan({
      history: first.history,
      next: {
        orchestrationPlanId: 'plan-2',
        tradingOrchestratorId: 'orch-1',
        workspaceId: 'ws-1',
        exchangeScopeId: 'binance',
        marketSymbol: 'BTCUSDT',
        modeContext: 'paper',
        versionNumber: 2,
        publishedAt: '2026-08-10T13:00:00.000Z',
        publishedBy: 'op',
        intent: {
          objective: 'updated coordination objective',
          rationaleSummary: 'v2 descriptive intent',
        },
        metadata: baseMetadata,
      },
    });
    expect(second.previous?.lifecycle.status).toBe('archived');
    expect(second.previous?.version.version).toBe(1);
    expect(second.next.version.version).toBe(2);
    expect(second.next.lifecycle.status).toBe('ready');
    expect(second.history).toHaveLength(2);
    expect(first.next.lifecycle.status).toBe('ready');
  });

  it('rejects version overwrite and non-monotonic versions', () => {
    expect(() => assertNoPlanVersionOverwrite([{ version: 1 }], 1)).toThrow(/overwrite forbidden/);
    expect(() =>
      publishNextOrchestrationPlan({
        history: [],
        next: {
          orchestrationPlanId: 'plan-1',
          tradingOrchestratorId: 'orch-1',
          workspaceId: 'ws-1',
          exchangeScopeId: 'binance',
          marketSymbol: 'BTCUSDT',
          modeContext: 'paper',
          versionNumber: 2,
          publishedAt: '2026-08-10T12:00:00.000Z',
          publishedBy: 'op',
          intent: baseIntent,
          metadata: baseMetadata,
        },
      }),
    ).toThrow(/monotonic/);
  });

  it('never exposes workflow / selection / Session / Risk / Orders behaviour', () => {
    const plan = createPlanV1();
    expect(plan).not.toHaveProperty('selectStrategy');
    expect(plan).not.toHaveProperty('emitSessionHandoff');
    expect(plan).not.toHaveProperty('approveRisk');
    expect(plan).not.toHaveProperty('submitOrder');
    expect(plan).not.toHaveProperty('runWorkflow');
    expect(plan.intent.selectsStrategy).toBe(false);
    expect(plan.intent.createsSession).toBe(false);
  });
});
