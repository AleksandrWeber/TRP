import { UnprocessableEntityException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { describe, expect, it } from 'vitest';
import { CommandAuthorizationService } from '../../modules/auth/command-authorization.service';
import type { AuthUser } from '../../modules/auth/jwt.strategy';
import { Role } from '../../modules/identity/role';
import { InMemoryStrategyLibraryReadAdapter } from '../../modules/strategy-library/adapters/in-memory-strategy-library-read.adapter';
import { createStrategy } from '../../modules/strategy-library/domain/strategy';
import { createStrategyCertification } from '../../modules/strategy-library/domain/strategy-certification';
import { createStrategyEligibility } from '../../modules/strategy-library/domain/strategy-eligibility';
import { createStrategyVersion } from '../../modules/strategy-library/domain/strategy-version';
import { TradingOrchestratorController } from '../../modules/trading-orchestrator/trading-orchestrator.controller';
import { TradingOrchestratorProductService } from '../../modules/trading-orchestrator/trading-orchestrator-product.service';
import { TradingOrchestratorModule } from '../../modules/trading-orchestrator/trading-orchestrator.module';
import { InMemoryWorkspaceRepository } from '../../modules/workspace/repositories/in-memory-workspace.repository';
import { WorkspaceAccessService } from '../../modules/workspace/workspace-access.service';
import { WorkspaceDomainService } from '../../modules/workspace/workspace-domain.service';

const OWNER: AuthUser = {
  userId: 'pc11-owner',
  email: 'pc11@example.com',
  displayName: 'PC-11',
  role: Role.Trader,
};

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
    certifiedBy: OWNER.userId,
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

async function harness() {
  const workspaces = new WorkspaceDomainService(new InMemoryWorkspaceRepository());
  const access = new WorkspaceAccessService(workspaces);
  const commandAuthorization = new CommandAuthorizationService(access);
  const moduleRef = await Test.createTestingModule({
    imports: [TradingOrchestratorModule],
    providers: [TradingOrchestratorProductService],
  }).compile();
  const library = moduleRef.get(InMemoryStrategyLibraryReadAdapter);
  const product = moduleRef.get(TradingOrchestratorProductService);
  const controller = new TradingOrchestratorController(product, commandAuthorization, access);
  return { moduleRef, workspaces, library, controller };
}

/**
 * PC-11: Orchestrator HTTP over existing service/query ports.
 * Session remains Session owner. createsSession stays false.
 */
describe('PC-11 — Trading Orchestrator product', () => {
  it('lets a user browse plans, request orchestration, and inspect Session Handoff Intent', async () => {
    const { moduleRef, workspaces, library, controller } = await harness();
    const workspace = await workspaces.create({ name: 'Paper Lab', ownerUserId: OWNER.userId });
    seedEligible(library, workspace.id);

    const plan = controller.createPlan({ user: OWNER }, workspace.id, {
      marketSymbol: 'BTCUSDT',
      objective: 'Coordinate a certified paper selection',
    });
    expect(plan.lifecycleStatus).toBe('ready');
    expect(plan.createsSession).toBe(false);

    const requested = controller.requestRun({ user: OWNER }, workspace.id, {
      marketSymbol: 'BTCUSDT',
      orchestrationPlanId: plan.orchestrationPlanId,
      objective: plan.objective,
    });
    const proposed = controller.proposeSelection(
      { user: OWNER },
      workspace.id,
      { runId: requested.orchestrationRunId },
      {
        libraryEntryId: 'lib-entry-1',
        strategyVersionId: '1.0.0',
        envelopeVersion: 'env-1',
        tacticPoint: { symbol: 'BTCUSDT', timeframe: '1h', riskPerTrade: 0.5 },
      },
    );
    const handed = controller.emitHandoff(
      { user: OWNER },
      workspace.id,
      { runId: requested.orchestrationRunId },
      {
        selectionDecisionId: proposed.selectionDecisionId!,
        deploymentBindRef: 'dep-approved-1',
      },
    );

    const intent = controller.getHandoff({ user: OWNER }, workspace.id, {
      sessionHandoffIntentId: handed.sessionHandoffIntentId!,
    });
    expect(intent.createsSession).toBe(false);
    expect(intent.isOrder).toBe(false);
    expect(intent.isRiskDecision).toBe(false);
    expect(intent.deploymentBindRef).toBe('dep-approved-1');

    const history = controller.listRuns({ user: OWNER }, workspace.id, {});
    expect(history.items[0]?.status).toBe('handed_off');
    expect(history.items[0]?.ownsSessionLifecycle).toBe(false);
    await moduleRef.close();
  });

  it('does not start a Session when selection is rejected', async () => {
    const { moduleRef, workspaces, library, controller } = await harness();
    const workspace = await workspaces.create({ name: 'Paper Lab', ownerUserId: OWNER.userId });
    seedEligible(library, workspace.id);
    const requested = controller.requestRun({ user: OWNER }, workspace.id, {
      marketSymbol: 'BTCUSDT',
    });
    expect(() =>
      controller.proposeSelection(
        { user: OWNER },
        workspace.id,
        { runId: requested.orchestrationRunId },
        {
          libraryEntryId: 'lib-entry-1',
          strategyVersionId: '1.0.0',
          envelopeVersion: 'env-1',
          tacticPoint: { symbol: 'SOLUSDT', timeframe: '1h' },
        },
      ),
    ).toThrow(UnprocessableEntityException);
    const detail = controller.getRun({ user: OWNER }, workspace.id, {
      runId: requested.orchestrationRunId,
    });
    expect(detail.handoff).toBeNull();
    expect(detail.ownsSessionLifecycle).toBe(false);
    await moduleRef.close();
  });
});
