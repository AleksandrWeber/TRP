import { Test } from '@nestjs/testing';
import { describe, expect, it } from 'vitest';
import { InMemoryWorkspaceRepository } from '../../modules/workspace/repositories/in-memory-workspace.repository';
import { WorkspaceAccessService } from '../../modules/workspace/workspace-access.service';
import { WorkspaceDomainService } from '../../modules/workspace/workspace-domain.service';
import { deriveQualificationTargetId } from '../../modules/market-qualification';
import type { QualificationRun } from '../../modules/market-qualification/domain/qualification-run';
import {
  MARKET_QUALIFICATION_QUERY_PORT,
  type MarketQualificationQueryPort,
} from '../../modules/market-qualification/ports/market-qualification.port';
import { InMemoryMarketProfileStore } from '../../modules/market-profile/adapters/in-memory-market-profile-store';
import { MarketProfileQueryService } from '../../modules/market-profile/market-profile-query.service';
import { MarketProfileVersioningService } from '../../modules/market-profile/market-profile-versioning.service';
import {
  MARKET_PROFILE_PORTS_ACTIVE,
  MARKET_PROFILE_QUERY_PORT,
  MARKET_PROFILE_SERVICE_PORT,
} from '../../modules/market-profile/ports/market-profile.port';
import { MarketProfileProductController } from '../../modules/market-profile-product/market-profile.controller';
import { MarketProfileProductService } from '../../modules/market-profile-product/market-profile-product.service';
import type { AuthUser } from '../../modules/auth/jwt.strategy';
import { Role } from '../../modules/identity/role';

const OWNER: AuthUser = {
  userId: 'pc09-owner',
  email: 'pc09@example.com',
  displayName: 'PC-09',
  role: Role.Trader,
};

const TARGET = {
  workspaceId: '',
  exchangeScopeId: 'scope-binance',
  marketSymbol: 'BTCUSDT',
};

/**
 * PC-09: Market Profile HTTP over existing query ports.
 * Qualification and Market State remain owners of their own concerns.
 * Publish remains the existing pipeline call — not this HTTP.
 */
describe('PC-09 — Market Profile product', () => {
  it('exposes existing profile queries without activating domain REST, publish, or scoring', async () => {
    const workspaces = new WorkspaceDomainService(new InMemoryWorkspaceRepository());
    const access = new WorkspaceAccessService(workspaces);
    const workspace = await workspaces.create({ name: 'Paper Lab', ownerUserId: OWNER.userId });
    TARGET.workspaceId = workspace.id;
    const targetId = deriveQualificationTargetId(
      workspace.id,
      TARGET.exchangeScopeId,
      TARGET.marketSymbol,
    );

    const completed: QualificationRun = Object.freeze({
      qualificationRunId: 'run-1',
      workspaceId: workspace.id,
      targetId,
      modeContext: 'paper',
      status: 'completed',
      requestedBy: OWNER.userId,
      confirmedBy: OWNER.userId,
      inputSummary: Object.freeze({
        observationCount: 0,
        researchRefCount: 0,
        liveMarketDataRefs: Object.freeze([] as string[]),
        researchOutputRefs: Object.freeze([] as string[]),
      }),
      completedAt: '2026-08-15T20:00:00.000Z',
      createdAt: '2026-08-15T20:00:00.000Z',
      authorityClass: 'research_artifact',
    }) as QualificationRun;

    const qualQuery: MarketQualificationQueryPort = {
      getQualificationTarget: () => null,
      getQualificationState: () => null,
      getMarketConfidence: () => null,
      getMarketHealth: () => null,
      listQualificationTargets: () => Object.freeze([]),
      listQualificationRuns: () => Object.freeze([]),
      getQualificationRun: (query) => {
        if (query.workspaceId !== workspace.id || query.qualificationRunId !== 'run-1') return null;
        return Object.freeze({
          ...completed,
          forcesTrade: false as const,
          authorizesSession: false as const,
        });
      },
    };

    const moduleRef = await Test.createTestingModule({
      providers: [
        InMemoryMarketProfileStore,
        MarketProfileVersioningService,
        MarketProfileQueryService,
        MarketProfileProductService,
        { provide: MARKET_QUALIFICATION_QUERY_PORT, useValue: qualQuery },
        {
          provide: MARKET_PROFILE_SERVICE_PORT,
          useExisting: MarketProfileVersioningService,
        },
        {
          provide: MARKET_PROFILE_QUERY_PORT,
          useExisting: MarketProfileQueryService,
        },
      ],
    }).compile();

    const store = moduleRef.get(InMemoryMarketProfileStore);
    store.clear();
    const publisher = moduleRef.get(MarketProfileVersioningService);
    const product = moduleRef.get(MarketProfileProductService);
    const controller = new MarketProfileProductController(product, access);

    expect(MARKET_PROFILE_PORTS_ACTIVE.rest).toBe(false);

    const published = publisher.publishProfileVersion({
      workspaceId: workspace.id,
      exchangeScopeId: TARGET.exchangeScopeId,
      marketSymbol: TARGET.marketSymbol,
      qualificationRunId: 'run-1',
      publishedBy: 'pipeline-1',
      publishedAt: '2026-08-15T20:00:00.000Z',
      volatility: {
        regimeLabel: 'moderate',
        metrics: { realized_range: 0.02, observation_count: 10 },
        windowSummary: 'caller-supplied window',
      },
      liquidity: {
        regimeLabel: 'moderate',
        metrics: { volume_level: 1, observation_count: 10 },
        windowSummary: 'caller-supplied window',
      },
      trend: {
        regimeLabel: 'low',
        metrics: { directional_bias: 0, observation_count: 10 },
        windowSummary: 'caller-supplied window',
      },
      structure: {
        characteristics: [
          { key: 'symbol_status', value: 'active' },
          { key: 'data_quality_flag', value: 'ok' },
        ],
      },
      confidenceSummary: {
        level: 'medium',
        sourceRunId: 'run-1',
        rationaleSummary: 'caller-supplied only',
      },
    });
    expect(published.outcome).toBe('published');

    const listed = controller.listLatest({ user: OWNER }, workspace.id);
    expect(listed.items).toHaveLength(1);
    expect(listed.calculatesProfile).toBe(false);
    expect(listed.scoresMarket).toBe(false);

    const latest = controller.getLatest({ user: OWNER }, workspace.id, { targetId });
    expect(latest.version).toBe(1);
    expect(latest.publishedSource.qualificationRunId).toBe('run-1');
    expect(latest.forcesTrade).toBe(false);
    expect(latest.isMarketQualification).toBe(false);

    const metadata = controller.getMetadata({ user: OWNER }, workspace.id, {
      targetId,
      version: 1,
    });
    expect(metadata.publishedBy).toBe('pipeline-1');

    await moduleRef.close();
  });
});
