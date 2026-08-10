/**
 * RC-26 Epic 5 — Orchestration workflow integration specs.
 *
 * Sequencing, delegation, failure propagation, no duplicated business logic.
 */

import { Test } from '@nestjs/testing';
import { describe, expect, it, vi } from 'vitest';
import { InMemoryStrategyLibraryReadAdapter } from '../../strategy-library/adapters/in-memory-strategy-library-read.adapter';
import { createStrategy } from '../../strategy-library/domain/strategy';
import { createStrategyCertification } from '../../strategy-library/domain/strategy-certification';
import { createStrategyEligibility } from '../../strategy-library/domain/strategy-eligibility';
import { createStrategyVersion } from '../../strategy-library/domain/strategy-version';
import { InMemoryOrchestratorMarketStateAdapter } from '../adapters/in-memory-market-state.adapter';
import { OrchestrationCoordinationStore } from './orchestration-coordination.store';
import {
  ORCHESTRATOR_RUNTIME_ENFORCEMENT_CONSUMER,
  ORCHESTRATOR_STRATEGY_LIBRARY_CONSUMER,
  TRADING_ORCHESTRATOR_QUERY_PORT,
  TRADING_ORCHESTRATOR_SERVICE_PORT,
  type OrchestratorRuntimeEnforcementConsumerPort,
  type OrchestratorStrategyLibraryConsumerPort,
  type TradingOrchestratorQueryPort,
  type TradingOrchestratorServicePort,
} from '../ports/trading-orchestrator.port';
import { TradingOrchestratorModule } from '../trading-orchestrator.module';

const asOf = '2026-08-10T18:00:00.000Z';
const createdAt = '2026-08-10T12:00:00.000Z';
const certifiedAt = '2026-08-10T13:00:00.000Z';
const evaluatedAt = '2026-08-10T14:00:00.000Z';

function seedEligible(adapter: InMemoryStrategyLibraryReadAdapter) {
  const strategy = createStrategy({
    strategyFamilyId: 'fam-momentum',
    name: 'Momentum',
    workspaceId: 'ws-1',
    createdAt,
  });
  const version = createStrategyVersion({
    libraryEntryId: 'lib-entry-1',
    strategyFamilyId: 'fam-momentum',
    version: '1.0.0',
    contentHash: 'sha256:abc',
    market: 'crypto-spot',
    supportedExchangeScopeIds: ['binance-spot'],
    supportedTimeframes: ['1h', '4h'],
    supportedSymbols: ['BTCUSDT', 'ETHUSDT'],
    workspaceId: 'ws-1',
    createdAt,
  });
  const certification = createStrategyCertification({
    certificationId: 'cert-1',
    strategyVersion: version,
    certifiedBy: 'operator-alice',
    certifiedAt,
    evidence: [
      {
        evidenceId: 'ev-bt-1',
        type: 'backtesting',
        sourceRef: { owner: 'backtesting', id: 'bt-1' },
      },
      {
        evidenceId: 'ev-wf-1',
        type: 'walk-forward',
        sourceRef: { owner: 'walk-forward', id: 'wf-1' },
      },
    ],
    tacticalEnvelope: {
      envelopeVersion: 'env-1',
      allowedMarkets: ['crypto-spot'],
      allowedExchangeScopeIds: ['binance-spot'],
      allowedSymbols: ['BTCUSDT', 'ETHUSDT'],
      allowedTimeframes: ['1h', '4h'],
      riskPerTrade: { min: 0.25, max: 1, step: 0.25 },
      maxPositions: { min: 1, max: 3 },
    },
  });
  const eligibility = createStrategyEligibility({
    eligibilityId: 'elig-1',
    certification,
    rulesVersion: 'rules-v1',
    evaluatedAt,
  });
  return adapter.seedEntry({ strategy, version, certification, eligibility });
}

async function boot() {
  const moduleRef = await Test.createTestingModule({
    imports: [TradingOrchestratorModule],
  }).compile();

  const library = moduleRef.get(InMemoryStrategyLibraryReadAdapter);
  seedEligible(library);

  const marketState = moduleRef.get(InMemoryOrchestratorMarketStateAdapter);
  marketState.seedCurrent({
    marketStateId: 'ms-1',
    workspaceId: 'ws-1',
    exchangeScopeId: 'binance-spot',
    marketSymbol: 'BTCUSDT',
    version: 1,
    lifecycleStatus: 'active',
    authorityClass: 'market_state_artifact',
    forcesTrade: false,
    isQualification: false,
    isProfile: false,
  });

  const service = moduleRef.get<TradingOrchestratorServicePort>(TRADING_ORCHESTRATOR_SERVICE_PORT);
  const query = moduleRef.get<TradingOrchestratorQueryPort>(TRADING_ORCHESTRATOR_QUERY_PORT);
  const store = moduleRef.get(OrchestrationCoordinationStore);
  const libraryConsumer = moduleRef.get<OrchestratorStrategyLibraryConsumerPort>(
    ORCHESTRATOR_STRATEGY_LIBRARY_CONSUMER,
  );
  const gateConsumer = moduleRef.get<OrchestratorRuntimeEnforcementConsumerPort>(
    ORCHESTRATOR_RUNTIME_ENFORCEMENT_CONSUMER,
  );

  return { moduleRef, service, query, store, marketState, libraryConsumer, gateConsumer, library };
}

describe('RC-26 Epic 5 — orchestration workflow', () => {
  it('happy path: Market State → Library → Gate → Session handoff intent', async () => {
    const { moduleRef, service, query } = await boot();

    const requested = service.requestOrchestrationRun({
      workspaceId: 'ws-1',
      exchangeScopeId: 'binance-spot',
      marketSymbol: 'BTCUSDT',
      modeContext: 'paper',
      requestedBy: 'op-1',
      asOf,
    });
    expect(requested.outcome).toBe('accepted');
    expect(requested.orchestrationRunId).toBeTruthy();
    expect(requested.forcesTrade).toBe(false);
    expect(requested.approvesRisk).toBe(false);
    expect(requested.submitsOrders).toBe(false);

    const proposed = service.proposeSelection({
      workspaceId: 'ws-1',
      orchestrationRunId: requested.orchestrationRunId,
      libraryEntryId: 'lib-entry-1',
      strategyVersionId: '1.0.0',
      envelopeVersion: 'env-1',
      tacticPoint: { symbol: 'BTCUSDT', timeframe: '1h', riskPerTrade: 0.5 },
      proposedBy: 'op-1',
      asOf,
    });
    expect(proposed.outcome).toBe('proposed');
    expect(proposed.selectionDecisionId).toBeTruthy();

    const handed = service.emitSessionHandoff({
      workspaceId: 'ws-1',
      orchestrationRunId: requested.orchestrationRunId,
      selectionDecisionId: proposed.selectionDecisionId!,
      deploymentBindRef: 'deploy-ref-1',
      requestedBy: 'op-1',
      asOf,
    });
    expect(handed.outcome).toBe('handed_off');
    expect(handed.sessionHandoffIntentId).toBeTruthy();
    expect(handed.enforcementDecisionRef).toBeTruthy();

    const run = query.getOrchestrationRun({
      workspaceId: 'ws-1',
      orchestrationRunId: requested.orchestrationRunId,
    });
    expect(run?.status).toBe('handed_off');
    expect(run?.authorityClass).toBe('orchestration_artifact');

    const intent = query.getSessionHandoffIntent({
      workspaceId: 'ws-1',
      sessionHandoffIntentId: handed.sessionHandoffIntentId!,
    });
    expect(intent?.createsSession).toBe(false);
    expect(intent?.isOrder).toBe(false);
    expect(intent?.isRiskDecision).toBe(false);
    expect(intent?.status).toBe('proposed');

    await moduleRef.close();
  });

  it('rejects missing Market State before Library/Gate', async () => {
    const { moduleRef, service, marketState } = await boot();
    marketState.clear();

    const requested = service.requestOrchestrationRun({
      workspaceId: 'ws-1',
      exchangeScopeId: 'binance-spot',
      marketSymbol: 'BTCUSDT',
      modeContext: 'paper',
      requestedBy: 'op-1',
      asOf,
    });
    expect(requested.outcome).toBe('rejected');
    expect(requested.rejectionReasons).toContain('missing_market_state');

    await moduleRef.close();
  });

  it('rejects ineligible / out-of-envelope tactic via Library eligibility (delegation)', async () => {
    const { moduleRef, service } = await boot();

    const requested = service.requestOrchestrationRun({
      workspaceId: 'ws-1',
      exchangeScopeId: 'binance-spot',
      marketSymbol: 'BTCUSDT',
      modeContext: 'paper',
      requestedBy: 'op-1',
      asOf,
    });

    const proposed = service.proposeSelection({
      workspaceId: 'ws-1',
      orchestrationRunId: requested.orchestrationRunId,
      libraryEntryId: 'lib-entry-1',
      strategyVersionId: '1.0.0',
      envelopeVersion: 'env-1',
      tacticPoint: { symbol: 'SOLUSDT', timeframe: '1h', riskPerTrade: 0.5 },
      proposedBy: 'op-1',
      asOf,
    });
    expect(proposed.outcome).toBe('rejected');
    expect(proposed.rejectionReasons?.some((r) => r.includes('eligibility'))).toBe(true);

    await moduleRef.close();
  });

  it('fail-closes on Gate reject and propagates enforcement reasons', async () => {
    const { moduleRef, service, gateConsumer } = await boot();

    const requested = service.requestOrchestrationRun({
      workspaceId: 'ws-1',
      exchangeScopeId: 'binance-spot',
      marketSymbol: 'BTCUSDT',
      modeContext: 'paper',
      requestedBy: 'op-1',
      asOf,
    });
    const proposed = service.proposeSelection({
      workspaceId: 'ws-1',
      orchestrationRunId: requested.orchestrationRunId,
      libraryEntryId: 'lib-entry-1',
      strategyVersionId: '1.0.0',
      envelopeVersion: 'env-1',
      tacticPoint: { symbol: 'BTCUSDT', timeframe: '1h', riskPerTrade: 0.5 },
      proposedBy: 'op-1',
      asOf,
    });

    const spy = vi.spyOn(gateConsumer, 'validateDeployment').mockReturnValue({
      outcome: 'fail',
      validation: 'INVALID',
      reasons: Object.freeze(['certification_not_active']),
      checkedAt: asOf,
      decisionRef: 'enf:mock-fail',
    });

    const handed = service.emitSessionHandoff({
      workspaceId: 'ws-1',
      orchestrationRunId: requested.orchestrationRunId,
      selectionDecisionId: proposed.selectionDecisionId!,
      deploymentBindRef: 'deploy-ref-1',
      requestedBy: 'op-1',
      asOf,
    });
    expect(handed.outcome).toBe('rejected');
    expect(handed.enforcementDecisionRef).toBe('enf:mock-fail');
    expect(handed.rejectionReasons).toContain('runtime_enforcement_rejected');
    expect(spy).toHaveBeenCalledTimes(1);

    await moduleRef.close();
  });

  it('requires confirmation before selection when requiresConfirmation=true', async () => {
    const { moduleRef, service } = await boot();

    const requested = service.requestOrchestrationRun({
      workspaceId: 'ws-1',
      exchangeScopeId: 'binance-spot',
      marketSymbol: 'BTCUSDT',
      modeContext: 'paper',
      requestedBy: 'op-1',
      requiresConfirmation: true,
      asOf,
    });

    const blocked = service.proposeSelection({
      workspaceId: 'ws-1',
      orchestrationRunId: requested.orchestrationRunId,
      libraryEntryId: 'lib-entry-1',
      strategyVersionId: '1.0.0',
      envelopeVersion: 'env-1',
      tacticPoint: { symbol: 'BTCUSDT', timeframe: '1h' },
      proposedBy: 'op-1',
      asOf,
    });
    expect(blocked.outcome).toBe('rejected');
    expect(blocked.rejectionReasons).toContain('confirmation_required');

    const confirmed = service.confirmOrchestrationRun({
      workspaceId: 'ws-1',
      orchestrationRunId: requested.orchestrationRunId,
      confirmedBy: 'op-1',
      changesActiveSessionMission: true,
      asOf,
    });
    expect(confirmed.outcome).toBe('accepted');

    const proposed = service.proposeSelection({
      workspaceId: 'ws-1',
      orchestrationRunId: requested.orchestrationRunId,
      libraryEntryId: 'lib-entry-1',
      strategyVersionId: '1.0.0',
      envelopeVersion: 'env-1',
      tacticPoint: { symbol: 'BTCUSDT', timeframe: '1h', riskPerTrade: 0.5 },
      proposedBy: 'op-1',
      asOf,
    });
    expect(proposed.outcome).toBe('proposed');

    await moduleRef.close();
  });

  it('delegates Library lookup/eligibility before Gate validateDeployment', async () => {
    const { moduleRef, service, libraryConsumer, gateConsumer } = await boot();

    const lookupSpy = vi.spyOn(libraryConsumer, 'lookupCertified');
    const eligSpy = vi.spyOn(libraryConsumer, 'checkEligibility');
    const gateSpy = vi.spyOn(gateConsumer, 'validateDeployment');

    const run = service.requestOrchestrationRun({
      workspaceId: 'ws-1',
      exchangeScopeId: 'binance-spot',
      marketSymbol: 'BTCUSDT',
      modeContext: 'paper',
      requestedBy: 'op-1',
      asOf,
    });
    const sel = service.proposeSelection({
      workspaceId: 'ws-1',
      orchestrationRunId: run.orchestrationRunId,
      libraryEntryId: 'lib-entry-1',
      strategyVersionId: '1.0.0',
      envelopeVersion: 'env-1',
      tacticPoint: { symbol: 'BTCUSDT', timeframe: '1h', riskPerTrade: 0.5 },
      proposedBy: 'op-1',
      asOf,
    });
    expect(sel.outcome).toBe('proposed');
    service.emitSessionHandoff({
      workspaceId: 'ws-1',
      orchestrationRunId: run.orchestrationRunId,
      selectionDecisionId: sel.selectionDecisionId!,
      deploymentBindRef: 'deploy-ref-1',
      requestedBy: 'op-1',
      asOf,
    });

    expect(lookupSpy).toHaveBeenCalled();
    expect(eligSpy).toHaveBeenCalled();
    expect(gateSpy).toHaveBeenCalled();
    expect(lookupSpy.mock.invocationCallOrder[0]!).toBeLessThan(
      gateSpy.mock.invocationCallOrder[0]!,
    );
    expect(eligSpy.mock.invocationCallOrder[0]!).toBeLessThan(gateSpy.mock.invocationCallOrder[0]!);

    await moduleRef.close();
  });

  it('never creates Session / Orders / Risk decisions on handoff intent', async () => {
    const { moduleRef, service, query } = await boot();
    const run = service.requestOrchestrationRun({
      workspaceId: 'ws-1',
      exchangeScopeId: 'binance-spot',
      marketSymbol: 'BTCUSDT',
      modeContext: 'paper',
      requestedBy: 'op-1',
      asOf,
    });
    const sel = service.proposeSelection({
      workspaceId: 'ws-1',
      orchestrationRunId: run.orchestrationRunId,
      libraryEntryId: 'lib-entry-1',
      strategyVersionId: '1.0.0',
      envelopeVersion: 'env-1',
      tacticPoint: { symbol: 'BTCUSDT', timeframe: '1h', riskPerTrade: 0.5 },
      proposedBy: 'op-1',
      asOf,
    });
    const handoff = service.emitSessionHandoff({
      workspaceId: 'ws-1',
      orchestrationRunId: run.orchestrationRunId,
      selectionDecisionId: sel.selectionDecisionId!,
      deploymentBindRef: 'deploy-ref-1',
      requestedBy: 'op-1',
      asOf,
    });
    const intent = query.getSessionHandoffIntent({
      workspaceId: 'ws-1',
      sessionHandoffIntentId: handoff.sessionHandoffIntentId!,
    });
    expect(intent).not.toHaveProperty('orderId');
    expect(intent).not.toHaveProperty('riskDecisionId');
    expect(intent?.createsSession).toBe(false);

    await moduleRef.close();
  });
});
