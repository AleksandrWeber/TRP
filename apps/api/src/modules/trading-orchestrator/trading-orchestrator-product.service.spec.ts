import { Test } from '@nestjs/testing';
import { describe, expect, it } from 'vitest';
import { InMemoryStrategyLibraryReadAdapter } from '../strategy-library/adapters/in-memory-strategy-library-read.adapter';
import { createStrategy } from '../strategy-library/domain/strategy';
import { createStrategyCertification } from '../strategy-library/domain/strategy-certification';
import { createStrategyEligibility } from '../strategy-library/domain/strategy-eligibility';
import { createStrategyVersion } from '../strategy-library/domain/strategy-version';
import { OrchestrationRejectedError } from './orchestration-rejected.error';
import { TradingOrchestratorProductService } from './trading-orchestrator-product.service';
import { TradingOrchestratorModule } from './trading-orchestrator.module';

const createdAt = '2026-08-15T12:00:00.000Z';

function seedEligible(adapter: InMemoryStrategyLibraryReadAdapter, workspaceId: string) {
  const strategy = createStrategy({
    strategyFamilyId: 'fam-momentum',
    name: 'Momentum',
    workspaceId,
    createdAt,
  });
  const version = createStrategyVersion({
    libraryEntryId: 'lib-entry-1',
    strategyFamilyId: 'fam-momentum',
    version: '1.0.0',
    contentHash: 'sha256:abc',
    market: 'crypto-spot',
    supportedExchangeScopeIds: ['binance-spot'],
    supportedTimeframes: ['1h'],
    supportedSymbols: ['BTCUSDT'],
    workspaceId,
    createdAt,
  });
  const certification = createStrategyCertification({
    certificationId: 'cert-1',
    strategyVersion: version,
    certifiedBy: 'operator-alice',
    certifiedAt: createdAt,
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
      allowedSymbols: ['BTCUSDT'],
      allowedTimeframes: ['1h'],
      riskPerTrade: { min: 0.25, max: 1, step: 0.25 },
      maxPositions: { min: 1, max: 3 },
    },
  });
  const eligibility = createStrategyEligibility({
    eligibilityId: 'elig-1',
    certification,
    rulesVersion: 'rules-v1',
    evaluatedAt: createdAt,
  });
  adapter.seedEntry({ strategy, version, certification, eligibility });
}

async function boot() {
  const moduleRef = await Test.createTestingModule({
    imports: [TradingOrchestratorModule],
    providers: [TradingOrchestratorProductService],
  }).compile();
  const library = moduleRef.get(InMemoryStrategyLibraryReadAdapter);
  seedEligible(library, 'ws-1');
  const product = moduleRef.get(TradingOrchestratorProductService);
  return { moduleRef, product };
}

describe('TradingOrchestratorProductService (PC-11)', () => {
  it('creates a ready plan and lists it without Session ownership', async () => {
    const { moduleRef, product } = await boot();
    const plan = product.createPlan({
      workspaceId: 'ws-1',
      requestedBy: 'trader-1',
      marketSymbol: 'BTCUSDT',
      objective: 'Coordinate a certified paper selection',
    });
    expect(plan.lifecycleStatus).toBe('ready');
    expect(plan.createsSession).toBe(false);
    expect(product.listPlans('ws-1')).toHaveLength(1);
    expect(product.getPlan('ws-1', plan.orchestrationPlanId)?.objective).toBe(
      'Coordinate a certified paper selection',
    );
    await moduleRef.close();
  });

  it('requests a run, proposes selection, and emits a handoff intent with createsSession false', async () => {
    const { moduleRef, product } = await boot();
    const plan = product.createPlan({
      workspaceId: 'ws-1',
      requestedBy: 'trader-1',
      marketSymbol: 'BTCUSDT',
      objective: 'Coordinate a certified paper selection',
    });
    const requested = product.requestRun({
      workspaceId: 'ws-1',
      requestedBy: 'trader-1',
      marketSymbol: 'BTCUSDT',
      orchestrationPlanId: plan.orchestrationPlanId,
    });
    expect(requested.outcome).toBe('accepted');
    expect(requested.forcesTrade).toBe(false);

    const proposed = product.proposeSelection({
      workspaceId: 'ws-1',
      orchestrationRunId: requested.orchestrationRunId,
      libraryEntryId: 'lib-entry-1',
      strategyVersionId: '1.0.0',
      envelopeVersion: 'env-1',
      tacticPoint: { symbol: 'BTCUSDT', timeframe: '1h', riskPerTrade: 0.5 },
      proposedBy: 'trader-1',
    });
    expect(proposed.outcome).toBe('proposed');

    const handed = product.emitHandoff({
      workspaceId: 'ws-1',
      orchestrationRunId: requested.orchestrationRunId,
      selectionDecisionId: proposed.selectionDecisionId!,
      deploymentBindRef: 'dep-1',
      requestedBy: 'trader-1',
    });
    expect(handed.outcome).toBe('handed_off');

    const detail = product.getRun('ws-1', requested.orchestrationRunId);
    expect(detail?.status).toBe('handed_off');
    expect(detail?.orchestrationPlanId).toBe(plan.orchestrationPlanId);
    expect(detail?.handoff?.createsSession).toBe(false);
    expect(detail?.handoff?.isOrder).toBe(false);
    expect(detail?.ownsSessionLifecycle).toBe(false);
    expect(product.listRuns('ws-1')[0]?.orchestrationRunId).toBe(requested.orchestrationRunId);
    await moduleRef.close();
  });

  it('rejects an ineligible tactic without creating a Session', async () => {
    const { moduleRef, product } = await boot();
    const requested = product.requestRun({
      workspaceId: 'ws-1',
      requestedBy: 'trader-1',
      marketSymbol: 'BTCUSDT',
    });
    expect(() =>
      product.proposeSelection({
        workspaceId: 'ws-1',
        orchestrationRunId: requested.orchestrationRunId,
        libraryEntryId: 'lib-entry-1',
        strategyVersionId: '1.0.0',
        envelopeVersion: 'env-1',
        tacticPoint: { symbol: 'SOLUSDT', timeframe: '1h', riskPerTrade: 0.5 },
        proposedBy: 'trader-1',
      }),
    ).toThrow(OrchestrationRejectedError);
    const run = product.getRun('ws-1', requested.orchestrationRunId);
    expect(run?.status).toBe('rejected');
    expect(run?.sessionHandoffIntentId).toBeNull();
    await moduleRef.close();
  });
});
