import { describe, expect, it, vi } from 'vitest';
import { OrderStatus, TERMINAL_ORDER_STATUSES } from '../modules/orders';
import { RealRecoveryReconciliationPorts } from './real-recovery-reconciliation.ports';

const workspaceId = 'ws-1';
const sessionId = 'session-1';

function order(input: {
  id: string;
  sessionId?: string;
  paperAccountId?: string;
  status?: OrderStatus;
}): {
  id: string;
  status: OrderStatus;
  intent: { tradingSessionId: string; paperAccountId: string };
} {
  return {
    id: input.id,
    status: input.status ?? OrderStatus.FILLED,
    intent: {
      tradingSessionId: input.sessionId ?? sessionId,
      paperAccountId: input.paperAccountId ?? 'account-1',
    },
  };
}

describe('US291 — RealRecoveryReconciliationPorts', () => {
  const list = vi.fn();
  const reconcile = vi.fn();
  const get = vi.fn();
  const orders = { list } as never;
  const execution = { reconcile } as never;
  const accounting = { get } as never;

  const ports = new RealRecoveryReconciliationPorts(orders, execution, accounting);

  it('lists only Orders for the requested session via existing list API', async () => {
    list.mockResolvedValue([
      order({ id: 'o-2', sessionId }),
      order({ id: 'o-1', sessionId }),
      order({ id: 'o-other', sessionId: 'session-other' }),
    ]);

    const result = await ports.listOrdersBySession(workspaceId, sessionId);

    expect(list).toHaveBeenCalledWith(workspaceId);
    expect(result.map((row) => row.orderId)).toEqual(['o-1', 'o-2']);
    expect(result[0]).toEqual({
      orderId: 'o-1',
      status: OrderStatus.FILLED,
      tradingSessionId: sessionId,
      paperAccountId: 'account-1',
      openOrUncertain: !TERMINAL_ORDER_STATUSES.has(OrderStatus.FILLED),
    });
  });

  it('marks non-terminal Orders as openOrUncertain', async () => {
    list.mockResolvedValue([order({ id: 'o-open', status: OrderStatus.SUBMITTED })]);
    const result = await ports.listOrdersBySession(workspaceId, sessionId);
    expect(result[0]?.openOrUncertain).toBe(true);
  });

  it('maps ExecutionEngine.reconcile to RecoveryExecutionSnapshot', async () => {
    reconcile.mockResolvedValue({
      orderId: 'o-1',
      status: OrderStatus.FILLED,
      terminal: true,
      fills: [{ id: 'f-1' }, { id: 'f-2' }],
      reconciliationRequired: false,
    });

    const result = await ports.reconcileExecution(workspaceId, 'o-1');

    expect(reconcile).toHaveBeenCalledWith({ workspaceId, orderId: 'o-1' });
    expect(result).toEqual({
      orderId: 'o-1',
      status: OrderStatus.FILLED,
      terminal: true,
      fillCount: 2,
      reconciliationRequired: false,
    });
  });

  it('reads accounting checkpoint without rebuild writes', async () => {
    get.mockResolvedValue({
      status: 'consistent',
      sourceHash: 'src',
      rebuiltHash: 'src',
      reason: null,
    });

    const result = await ports.readAccounting(workspaceId, 'account-1');

    expect(get).toHaveBeenCalledWith(workspaceId, 'account-1');
    expect(result).toEqual({
      status: 'consistent',
      sourceHash: 'src',
      rebuiltHash: 'src',
      reason: null,
    });
  });

  it('returns null accounting when checkpoint is missing (fail-closed upstream)', async () => {
    get.mockResolvedValue(null);
    await expect(ports.readAccounting(workspaceId, 'account-1')).resolves.toBeNull();
  });

  it('keeps Risk optional (null) for US243 scope', async () => {
    await expect(ports.readRisk(workspaceId, sessionId)).resolves.toBeNull();
  });
});
