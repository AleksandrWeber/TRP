import { describe, expect, it } from 'vitest';
import { toBotView } from '../modules/bot-facade/domain/bot-view';
import { createTradingSession } from '../modules/trading-session/domain/trading-session';
import { V2_SOT_MAP, sotOwnerOf } from './v2-sot-map';
import { V2_WORKFLOW_HOPS, workflowSequence } from './v2-workflow-graph';
import {
  bootOrchestratorScenario,
  E2E_AS_OF,
  e2eCertifiedRecord,
  e2eLibraryReads,
} from './v2-e2e-fixtures';
import { V2_E2E_SCENARIOS } from './v2-e2e-scenarios';
import { validateDeployment } from '../modules/runtime-enforcement/domain/validate-deployment';

describe('RC-28 Epic 4 — ownership continuity', () => {
  it('keeps every certified hop and scenario free of ownership transfer', () => {
    expect(workflowSequence()).toEqual([
      'research-lab',
      'strategy-library',
      'runtime-enforcement',
      'trading-orchestrator',
      'trading-session',
      'orders',
      'execution',
      'accounting',
      'knowledge-lake',
      'reporting',
      'ai-analytics',
      'notification-delivery',
      'command-center',
    ]);
    expect(V2_WORKFLOW_HOPS.every((hop) => hop.ownershipTransfer === false)).toBe(true);
    expect(V2_E2E_SCENARIOS.every((row) => row.ownershipTransfer === false)).toBe(true);
  });

  it('Gate pass and Orchestrator handoff do not steal Session or money SoT', async () => {
    const decision = validateDeployment(
      {
        workspaceId: 'ws-1',
        libraryEntryId: 'lib-entry-1',
        purpose: 'deployment_bind',
        requestedAt: E2E_AS_OF,
      },
      e2eLibraryReads(e2eCertifiedRecord()),
      E2E_AS_OF,
    );
    expect(decision.outcome).toBe('pass');
    expect(sotOwnerOf('certified-strategy-lifecycle')).toBe('strategy-library');
    expect(sotOwnerOf('enforcement-pass-fail')).toBe('runtime-enforcement');

    const orch = await bootOrchestratorScenario();
    const requested = orch.service.requestOrchestrationRun({
      workspaceId: 'ws-1',
      exchangeScopeId: 'binance-spot',
      marketSymbol: 'BTCUSDT',
      modeContext: 'paper',
      requestedBy: 'op-1',
      asOf: E2E_AS_OF,
    });
    const proposed = orch.service.proposeSelection({
      workspaceId: 'ws-1',
      orchestrationRunId: requested.orchestrationRunId,
      libraryEntryId: 'lib-entry-1',
      strategyVersionId: '1.0.0',
      envelopeVersion: 'env-1',
      tacticPoint: { symbol: 'BTCUSDT', timeframe: '1h', riskPerTrade: 0.5 },
      proposedBy: 'op-1',
      asOf: E2E_AS_OF,
    });
    const handed = orch.service.emitSessionHandoff({
      workspaceId: 'ws-1',
      orchestrationRunId: requested.orchestrationRunId,
      selectionDecisionId: proposed.selectionDecisionId!,
      deploymentBindRef: 'deploy-ref-1',
      requestedBy: 'op-1',
      asOf: E2E_AS_OF,
    });
    const intent = orch.query.getSessionHandoffIntent({
      workspaceId: 'ws-1',
      sessionHandoffIntentId: handed.sessionHandoffIntentId!,
    });
    expect(intent?.createsSession).toBe(false);
    expect(sotOwnerOf('trading-session-lifecycle')).toBe('trading-session');
    expect(sotOwnerOf('orchestration-run')).toBe('trading-orchestrator');
    expect(sotOwnerOf('cash-ledger')).toBe('accounting');
    expect(sotOwnerOf('order-lifecycle')).toBe('orders');

    const session = createTradingSession({
      id: 'session-own-1',
      workspaceId: 'ws-1',
      paperAccountId: 'acct-1',
      exchangeScopeId: 'binance-spot',
      deploymentId: 'deploy-ref-1',
      origin: 'strategy',
      actorId: 'op-1',
      idempotencyKey: 'own-1',
      createdAt: E2E_AS_OF,
      recordedAt: E2E_AS_OF,
    });
    const bot = toBotView(session);
    expect(bot.id).toBe(session.id);
    expect(
      V2_SOT_MAP.filter((row) => row.isTradingFinanceSoT).every((row) =>
        ['orders', 'risk-engine', 'execution-engine', 'accounting', 'trading-session'].includes(
          row.owner,
        ),
      ),
    ).toBe(true);
    await orch.moduleRef.close();
  });
});
