/**
 * RC-26 Epic 6 — Trading Orchestrator consumer read specs.
 */

import { Test } from '@nestjs/testing';
import { describe, expect, it } from 'vitest';
import { InMemoryStrategyLibraryReadAdapter } from '../../strategy-library/adapters/in-memory-strategy-library-read.adapter';
import { createStrategy } from '../../strategy-library/domain/strategy';
import { createStrategyCertification } from '../../strategy-library/domain/strategy-certification';
import { createStrategyEligibility } from '../../strategy-library/domain/strategy-eligibility';
import { createStrategyVersion } from '../../strategy-library/domain/strategy-version';
import { InMemoryOrchestratorMarketStateAdapter } from '../adapters/in-memory-market-state.adapter';
import {
  TRADING_ORCHESTRATOR_CONSUMER_READ_PORT,
  TRADING_ORCHESTRATOR_SERVICE_PORT,
  type TradingOrchestratorConsumerReadPort,
  type TradingOrchestratorServicePort,
} from '../ports/trading-orchestrator.port';
import { TradingOrchestratorModule } from '../trading-orchestrator.module';

const asOf = '2026-08-10T20:00:00.000Z';
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

describe('RC-26 Epic 6 — Trading Orchestrator consumer reads', () => {
  it('projects immutable orchestration summary / selection / handoff', async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [TradingOrchestratorModule],
    }).compile();

    seedEligible(moduleRef.get(InMemoryStrategyLibraryReadAdapter));
    moduleRef.get(InMemoryOrchestratorMarketStateAdapter).seedCurrent({
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

    const service = moduleRef.get<TradingOrchestratorServicePort>(
      TRADING_ORCHESTRATOR_SERVICE_PORT,
    );
    const consumer = moduleRef.get<TradingOrchestratorConsumerReadPort>(
      TRADING_ORCHESTRATOR_CONSUMER_READ_PORT,
    );

    const run = service.requestOrchestrationRun({
      workspaceId: 'ws-1',
      exchangeScopeId: 'binance-spot',
      marketSymbol: 'BTCUSDT',
      modeContext: 'paper',
      requestedBy: 'op-1',
      objective: 'coordinate certified strategy',
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

    const summary = consumer.getOrchestrationSummary({
      workspaceId: 'ws-1',
      orchestrationRunId: run.orchestrationRunId,
    });
    expect(Object.isFrozen(summary)).toBe(true);
    expect(summary?.status).toBe('handed_off');
    expect(summary?.intentObjective).toBe('coordinate certified strategy');
    expect(summary?.handoffStatus).toBe('proposed');
    expect(summary?.authorityClass).toBe('orchestration_artifact');
    expect(summary?.forcesTrade).toBe(false);
    expect(summary?.approvesRisk).toBe(false);
    expect(summary?.submitsOrders).toBe(false);
    expect(summary?.ownsSessionLifecycle).toBe(false);
    expect(summary?.isExecutionEngine).toBe(false);
    expect(summary?.consumerWritable).toBe(false);

    const selection = consumer.getLatestSelectionProjection({
      workspaceId: 'ws-1',
      selectionDecisionId: sel.selectionDecisionId!,
    });
    expect(selection?.inventsStrategy).toBe(false);
    expect(selection?.forcesTrade).toBe(false);

    const intent = consumer.getHandoffIntentProjection({
      workspaceId: 'ws-1',
      sessionHandoffIntentId: handoff.sessionHandoffIntentId!,
    });
    expect(intent?.createsSession).toBe(false);
    expect(intent?.isOrder).toBe(false);
    expect(intent?.isRiskDecision).toBe(false);
    expect(intent?.status).toBe('proposed');

    await moduleRef.close();
  });
});
