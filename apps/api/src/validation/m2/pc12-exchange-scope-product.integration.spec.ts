import { Test } from '@nestjs/testing';
import { describe, expect, it } from 'vitest';
import { InMemoryWorkspaceRepository } from '../../modules/workspace/repositories/in-memory-workspace.repository';
import { WorkspaceAccessService } from '../../modules/workspace/workspace-access.service';
import { WorkspaceDomainService } from '../../modules/workspace/workspace-domain.service';
import { ExchangeScopeModule } from '../../modules/exchange-scope';
import { InMemoryExchangeScopeStore } from '../../modules/exchange-scope/adapters/in-memory-exchange-scope-store';
import { EXCHANGE_SCOPE_PORTS_ACTIVE } from '../../modules/exchange-scope/ports/exchange-scope.port';
import { ExchangeScopeProductController } from '../../modules/exchange-scope-product/exchange-scope.controller';
import { ExchangeScopeProductService } from '../../modules/exchange-scope-product/exchange-scope-product.service';
import type { AuthUser } from '../../modules/auth/jwt.strategy';
import { Role } from '../../modules/identity/role';

const OWNER: AuthUser = {
  userId: 'pc12-owner',
  email: 'pc12@example.com',
  displayName: 'PC-12',
  role: Role.Trader,
};

/**
 * PC-12: Exchange Scope HTTP over existing service/query/consumer-read ports.
 * Runtime, Session, and Deployment remain owners of their own concerns.
 */
describe('PC-12 — Exchange Scope product', () => {
  it('exposes existing scope operations without activating domain REST or venue APIs', async () => {
    const workspaces = new WorkspaceDomainService(new InMemoryWorkspaceRepository());
    const access = new WorkspaceAccessService(workspaces);
    const workspace = await workspaces.create({ name: 'Paper Lab', ownerUserId: OWNER.userId });

    const moduleRef = await Test.createTestingModule({
      imports: [ExchangeScopeModule],
      providers: [ExchangeScopeProductService],
    }).compile();

    const store = moduleRef.get(InMemoryExchangeScopeStore);
    store.clear();
    const product = moduleRef.get(ExchangeScopeProductService);
    const controller = new ExchangeScopeProductController(product, access);

    expect(EXCHANGE_SCOPE_PORTS_ACTIVE.rest).toBe(false);

    const created = controller.create({ user: OWNER }, workspace.id, {
      venueCode: 'binance',
      displayName: 'Binance paper',
      modeContext: 'paper',
      maxActiveSessions: 1,
    });
    expect(created.outcome).toBe('accepted');
    expect(created.liveVenueAdapter).toBe(false);
    expect(created.venueApiUsed).toBe(false);

    const listed = controller.list({ user: OWNER }, workspace.id, {});
    expect(listed.items).toHaveLength(1);

    const activated = controller.activate(
      { user: OWNER },
      workspace.id,
      { exchangeScopeId: created.exchangeScopeId },
      {},
    );
    expect(activated.scope?.lifecycle.status).toBe('active');

    const detail = controller.get({ user: OWNER }, workspace.id, {
      exchangeScopeId: created.exchangeScopeId,
    });
    expect(detail.current.isActive).toBe(true);
    expect(detail.isRuntime).toBe(false);
    expect(detail.isTradingSession).toBe(false);

    await moduleRef.close();
  });
});
