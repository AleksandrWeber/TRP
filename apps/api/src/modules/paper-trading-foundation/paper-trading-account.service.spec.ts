import { beforeEach, describe, expect, it, vi } from 'vitest';
import { PaperTradingAccountAudit } from './paper-trading-account.audit';
import { PaperTradingAccountService } from './paper-trading-account.service';
import { InMemoryPaperTradingAccountStore } from './paper-trading-account.store';

describe('PaperTradingAccountService (W2-S04-a)', () => {
  let store: InMemoryPaperTradingAccountStore;
  let audit: { record: ReturnType<typeof vi.fn> };
  let service: PaperTradingAccountService;

  beforeEach(() => {
    store = new InMemoryPaperTradingAccountStore();
    audit = { record: vi.fn().mockResolvedValue(undefined) };
    service = new PaperTradingAccountService(store, audit as unknown as PaperTradingAccountAudit);
  });

  it('projects Not Created when the workspace has no account', async () => {
    const projection = await service.getProjection('workspace-a');
    expect(projection).toEqual({ status: 'NOT_CREATED', account: null });
  });

  it('creates exactly one Active Paper Account per workspace', async () => {
    const created = await service.create({
      workspaceId: 'workspace-a',
      ownerId: 'user-1',
      startingBalance: '50000',
    });
    expect(created.status).toBe('ACTIVE');
    expect(created.baseCurrency).toBe('USD');
    expect(created.startingBalance).toBe('50000');
    expect(created.currentBalance).toBe('50000');

    await expect(service.create({ workspaceId: 'workspace-a', ownerId: 'user-1' })).rejects.toThrow(
      /already exists/,
    );

    const projection = await service.getProjection('workspace-a');
    expect(projection.status).toBe('ACTIVE');
    expect(projection.account?.id).toBe(created.id);
  });

  it('isolates Paper Accounts by workspace', async () => {
    await service.create({ workspaceId: 'workspace-a', ownerId: 'user-1' });
    await service.create({ workspaceId: 'workspace-b', ownerId: 'user-2' });

    const a = await service.getProjection('workspace-a');
    const b = await service.getProjection('workspace-b');
    expect(a.account?.workspaceId).toBe('workspace-a');
    expect(b.account?.workspaceId).toBe('workspace-b');
    expect(a.account?.id).not.toBe(b.account?.id);
    expect(await store.findByWorkspace('workspace-c')).toBeNull();
  });

  it('disables and activates with audit outcomes', async () => {
    await service.create({ workspaceId: 'workspace-a', ownerId: 'user-1' });
    const disabled = await service.disable('workspace-a', 'user-1');
    expect(disabled.status).toBe('DISABLED');

    const activated = await service.activate('workspace-a', 'user-1');
    expect(activated.status).toBe('ACTIVE');

    const outcomes = audit.record.mock.calls.map((call) => call[0].outcome);
    expect(outcomes).toEqual([
      'paper_account_created',
      'paper_account_activated',
      'paper_account_disabled',
      'paper_account_activated',
    ]);
  });
});
