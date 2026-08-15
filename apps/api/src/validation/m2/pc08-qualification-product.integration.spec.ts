import { Test } from '@nestjs/testing';
import { describe, expect, it } from 'vitest';
import { InMemoryWorkspaceRepository } from '../../modules/workspace/repositories/in-memory-workspace.repository';
import { WorkspaceAccessService } from '../../modules/workspace/workspace-access.service';
import { WorkspaceDomainService } from '../../modules/workspace/workspace-domain.service';
import { KNOWLEDGE_LAKE_QUERY_PORT } from '../../modules/knowledge-lake/ports/knowledge-lake-query.port';
import { MarketDataQueryService } from '../../modules/live-market-data/api/market-data-query.service';
import { InMemoryQualificationStore } from '../../modules/market-qualification/adapters/in-memory-qualification-store';
import { LiveMarketDataReadAdapter } from '../../modules/market-qualification/adapters/live-market-data-read.adapter';
import { ResearchOutputReadAdapter } from '../../modules/market-qualification/adapters/research-output-read.adapter';
import { MarketQualificationLifecycleService } from '../../modules/market-qualification/market-qualification-lifecycle.service';
import { MarketQualificationObservationalReadService } from '../../modules/market-qualification/market-qualification-observational-read.service';
import { MarketQualificationQueryService } from '../../modules/market-qualification/market-qualification-query.service';
import {
  LIVE_MARKET_DATA_READ_CONSUMER,
  MARKET_QUALIFICATION_PORTS_ACTIVE,
  MARKET_QUALIFICATION_QUERY_PORT,
  MARKET_QUALIFICATION_SERVICE_PORT,
  RESEARCH_OUTPUT_READ_CONSUMER,
} from '../../modules/market-qualification/ports/market-qualification.port';
import { QualificationProductController } from '../../modules/qualification-product/qualification.controller';
import { QualificationProductService } from '../../modules/qualification-product/qualification-product.service';
import type { AuthUser } from '../../modules/auth/jwt.strategy';
import { Role } from '../../modules/identity/role';

const OWNER: AuthUser = {
  userId: 'pc08-owner',
  email: 'pc08@example.com',
  displayName: 'PC-08',
  role: Role.Trader,
};

/**
 * PC-08: Qualification HTTP over existing service/query ports.
 * Profile and Market State remain owners of their own concerns.
 */
describe('PC-08 — Qualification product', () => {
  it('exposes existing qualification operations without activating domain REST or scoring', async () => {
    const workspaces = new WorkspaceDomainService(new InMemoryWorkspaceRepository());
    const access = new WorkspaceAccessService(workspaces);
    const workspace = await workspaces.create({ name: 'Paper Lab', ownerUserId: OWNER.userId });

    const moduleRef = await Test.createTestingModule({
      providers: [
        LiveMarketDataReadAdapter,
        ResearchOutputReadAdapter,
        MarketQualificationObservationalReadService,
        InMemoryQualificationStore,
        MarketQualificationLifecycleService,
        MarketQualificationQueryService,
        QualificationProductService,
        {
          provide: MarketDataQueryService,
          useValue: {
            listStatuses: () => Object.freeze([]),
            listLatest: () => Object.freeze([]),
            listSubscriptions: () => Object.freeze([]),
            getStatus: () => null,
            getLatest: () => null,
            getSubscription: () => null,
          },
        },
        {
          provide: KNOWLEDGE_LAKE_QUERY_PORT,
          useValue: {
            getByEventId: () => null,
            list: () => ({ authorityClass: 'projection' as const, items: [], nextCursor: null }),
          },
        },
        { provide: LIVE_MARKET_DATA_READ_CONSUMER, useExisting: LiveMarketDataReadAdapter },
        { provide: RESEARCH_OUTPUT_READ_CONSUMER, useExisting: ResearchOutputReadAdapter },
        {
          provide: MARKET_QUALIFICATION_SERVICE_PORT,
          useExisting: MarketQualificationLifecycleService,
        },
        {
          provide: MARKET_QUALIFICATION_QUERY_PORT,
          useExisting: MarketQualificationQueryService,
        },
      ],
    }).compile();

    const store = moduleRef.get(InMemoryQualificationStore);
    store.clear();
    const product = moduleRef.get(QualificationProductService);
    const controller = new QualificationProductController(product, access);

    expect(MARKET_QUALIFICATION_PORTS_ACTIVE.rest).toBe(false);

    const created = controller.request({ user: OWNER }, workspace.id, {
      exchangeScopeId: 'scope-binance',
      marketSymbol: 'BTCUSDT',
      modeContext: 'paper',
    });
    expect(created.outcome).toBe('accepted');
    expect(created.forcesTrade).toBe(false);
    expect(created.scoresMarket).toBe(false);

    const listed = controller.listTargets({ user: OWNER }, workspace.id);
    expect(listed.items).toHaveLength(1);

    const confirmed = controller.confirm({ user: OWNER }, workspace.id, {
      qualificationRunId: created.qualificationRunId,
    });
    expect(confirmed.outcome).toBe('running');
    expect(confirmed.target?.lifecycle.state).toBe('qualifying');

    const completed = controller.complete({ user: OWNER }, workspace.id, {
      qualificationRunId: created.qualificationRunId,
    });
    expect(completed.outcome).toBe('completed');
    expect(completed.target?.lifecycle.state).toBe('qualified');
    expect(completed.calculatesConfidence).toBe(false);
    expect(completed.isMarketProfile).toBe(false);

    await moduleRef.close();
  });
});
