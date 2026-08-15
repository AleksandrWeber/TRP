import {
  BadRequestException,
  ForbiddenException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { describe, expect, it } from 'vitest';
import { CommandAuthorizationService } from '../auth/command-authorization.service';
import type { AuthUser } from '../auth/jwt.strategy';
import { Role } from '../identity/role';
import { InMemoryStrategyLibraryReadAdapter } from '../strategy-library/adapters/in-memory-strategy-library-read.adapter';
import { createStrategy } from '../strategy-library/domain/strategy';
import { createStrategyCertification } from '../strategy-library/domain/strategy-certification';
import { createStrategyEligibility } from '../strategy-library/domain/strategy-eligibility';
import { createStrategyVersion } from '../strategy-library/domain/strategy-version';
import { InMemoryWorkspaceRepository } from '../workspace/repositories/in-memory-workspace.repository';
import { WorkspaceAccessService } from '../workspace/workspace-access.service';
import { WorkspaceDomainService } from '../workspace/workspace-domain.service';
import { TradingOrchestratorController } from './trading-orchestrator.controller';
import { TradingOrchestratorProductService } from './trading-orchestrator-product.service';
import { TradingOrchestratorModule } from './trading-orchestrator.module';

const OWNER: AuthUser = {
  userId: 'pc11-trader',
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

describe('TradingOrchestratorController (PC-11)', () => {
  it('creates a plan, runs coordination, and returns a Session handoff intent', async () => {
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
        deploymentBindRef: 'dep-1',
      },
    );
    expect(handed.outcome).toBe('handed_off');

    const detail = controller.getRun({ user: OWNER }, workspace.id, {
      runId: requested.orchestrationRunId,
    });
    expect(detail.handoff?.createsSession).toBe(false);
    expect(detail.handoff?.deploymentBindRef).toBe('dep-1');
    expect(detail).not.toHaveProperty('sessionId');
    expect(controller.listPlans({ user: OWNER }, workspace.id).items).toHaveLength(1);
    expect(controller.listRuns({ user: OWNER }, workspace.id, {}).items).toHaveLength(1);
    await moduleRef.close();
  });

  it('maps Gate FAIL to 422 without a Session start', async () => {
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
          tacticPoint: { symbol: 'SOLUSDT', timeframe: '1h', riskPerTrade: 0.5 },
        },
      ),
    ).toThrow(UnprocessableEntityException);
    await moduleRef.close();
  });

  it('requires a workspace header and isolates foreign workspaces', async () => {
    const { moduleRef, workspaces, controller } = await harness();
    const workspace = await workspaces.create({ name: 'Paper Lab', ownerUserId: OWNER.userId });
    expect(() => controller.listPlans({ user: OWNER }, undefined)).toThrow(BadRequestException);
    const stranger: AuthUser = {
      userId: 'stranger',
      email: 'x@example.com',
      displayName: 'X',
      role: Role.Trader,
    };
    expect(() => controller.listPlans({ user: stranger }, workspace.id)).toThrow(
      ForbiddenException,
    );
    await moduleRef.close();
  });
});
