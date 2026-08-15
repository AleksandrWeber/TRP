import { describe, expect, it } from 'vitest';
import { InMemoryWorkspaceRepository } from '../../modules/workspace/repositories/in-memory-workspace.repository';
import { WorkspaceAccessService } from '../../modules/workspace/workspace-access.service';
import { WorkspaceDomainService } from '../../modules/workspace/workspace-domain.service';
import { createMarketState } from '../../modules/market-state/domain/market-state';
import { MarketStateProjectionStore } from '../../modules/market-state/domain/market-state-projection.store';
import type { MarketStateObservationalReadService } from '../../modules/market-state/market-state-observational-read.service';
import { MARKET_STATE_PORTS_ACTIVE } from '../../modules/market-state/ports/market-state.port';
import { MarketStateProductController } from '../../modules/market-state-product/market-state.controller';
import { MarketStateProductService } from '../../modules/market-state-product/market-state-product.service';
import { deriveMarketStateTargetId } from '../../modules/market-state-product/market-state.view';
import type { AuthUser } from '../../modules/auth/jwt.strategy';
import { Role } from '../../modules/identity/role';

const OWNER: AuthUser = {
  userId: 'pc10-owner',
  email: 'pc10@example.com',
  displayName: 'PC-10',
  role: Role.Trader,
};

/**
 * PC-10: Market State HTTP over existing query/refresh surfaces.
 * Qualification, Profile, and Trading Orchestrator remain owners of their own concerns.
 * Classify is not exposed.
 */
describe('PC-10 — Market State product', () => {
  it('exposes existing state queries/refresh without activating domain REST or classification', async () => {
    const workspaces = new WorkspaceDomainService(new InMemoryWorkspaceRepository());
    const access = new WorkspaceAccessService(workspaces);
    const workspace = await workspaces.create({ name: 'Paper Lab', ownerUserId: OWNER.userId });
    const target = {
      workspaceId: workspace.id,
      exchangeScopeId: 'scope-binance',
      marketSymbol: 'BTCUSDT',
    };
    const targetId = deriveMarketStateTargetId(
      target.workspaceId,
      target.exchangeScopeId,
      target.marketSymbol,
    );

    const observational = {
      getQualificationSummary: () => null,
      getLatestProfile: () => null,
    } as unknown as MarketStateObservationalReadService;
    const store = new MarketStateProjectionStore();
    const product = new MarketStateProductService(store, observational);
    const controller = new MarketStateProductController(product, access);

    expect(MARKET_STATE_PORTS_ACTIVE.rest).toBe(false);
    expect(MARKET_STATE_PORTS_ACTIVE.marketStateService).toBe(false);
    expect(MARKET_STATE_PORTS_ACTIVE.marketStateQuery).toBe(false);

    const marketStateId = `${targetId}:v1`;
    store.seed(
      createMarketState({
        marketStateId,
        ...target,
        version: {
          marketStateId,
          version: 1,
          publishedAt: '2026-08-15T20:00:00.000Z',
          publishedBy: 'pipeline-1',
        },
        lifecycle: {
          status: 'active',
          updatedAt: '2026-08-15T20:00:00.000Z',
          updatedBy: 'pipeline-1',
          reason: 'activated',
        },
        snapshot: {
          regime: 'quiet',
          narrativeSummary: 'caller-supplied snapshot',
        },
        metadata: {
          observationAsOf: '2026-08-15T20:00:00.000Z',
          inputSummary: 'seeded current-condition artifact',
        },
      }),
    );

    const listed = controller.listCurrent({ user: OWNER }, workspace.id);
    expect(listed.items).toHaveLength(1);
    expect(listed.classifiesMarket).toBe(false);
    expect(listed.orchestrates).toBe(false);

    const current = controller.getCurrent({ user: OWNER }, workspace.id, { targetId });
    expect(current.version).toBe(1);
    expect(current.lifecycle.status).toBe('active');
    expect(current.forcesTrade).toBe(false);
    expect(current.isQualification).toBe(false);
    expect(current.isProfile).toBe(false);

    const metadata = controller.getMetadata({ user: OWNER }, workspace.id, {
      targetId,
      version: 1,
    });
    expect(metadata.publishedBy).toBe('pipeline-1');

    const refreshed = controller.refresh({ user: OWNER }, workspace.id, { targetId }, {});
    expect(refreshed.outcome).toBe('accepted');
    expect(refreshed.version).toBe(2);
    expect(refreshed.current.snapshot.regimeLabel).toBe('quiet');
    expect(refreshed.classifiesMarket).toBe(false);
  });
});
