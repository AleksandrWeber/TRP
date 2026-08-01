import { Inject, Injectable } from '@nestjs/common';
import { OrderService, TERMINAL_ORDER_STATUSES } from '../modules/orders';
import { ExecutionEngineService } from '../modules/execution-engine';
import { AccountingReconciliationService } from '../modules/positions/reconciliation/accounting-reconciliation.service';
import type {
  RecoveryAccountingSnapshot,
  RecoveryExecutionSnapshot,
  RecoveryOrderSnapshot,
  RecoveryReconciliationPorts,
  RecoveryRiskSnapshot,
} from '../modules/trading-session';

/**
 * US291 — production RecoveryReconciliationPorts adapter.
 *
 * Binds existing Orders / Execution Engine / Accounting read surfaces at the
 * composition root so Trading Session never imports foreign BC modules.
 * Read-only: does not rebuild, reconcile-write, or mutate foreign aggregates.
 */
@Injectable()
export class RealRecoveryReconciliationPorts implements RecoveryReconciliationPorts {
  constructor(
    @Inject(OrderService) private readonly orders: OrderService,
    @Inject(ExecutionEngineService) private readonly execution: ExecutionEngineService,
    @Inject(AccountingReconciliationService)
    private readonly accounting: AccountingReconciliationService,
  ) {}

  async listOrdersBySession(
    workspaceId: string,
    sessionId: string,
  ): Promise<RecoveryOrderSnapshot[]> {
    const orders = await this.orders.list(workspaceId);
    return orders
      .filter((order) => order.intent.tradingSessionId === sessionId)
      .map((order) =>
        Object.freeze({
          orderId: order.id,
          status: order.status,
          tradingSessionId: order.intent.tradingSessionId,
          paperAccountId: order.intent.paperAccountId,
          openOrUncertain: !TERMINAL_ORDER_STATUSES.has(order.status),
        }),
      )
      .sort((a, b) => a.orderId.localeCompare(b.orderId));
  }

  async reconcileExecution(
    workspaceId: string,
    orderId: string,
  ): Promise<RecoveryExecutionSnapshot> {
    const result = await this.execution.reconcile({ workspaceId, orderId });
    return Object.freeze({
      orderId: result.orderId,
      status: result.status,
      terminal: result.terminal,
      fillCount: result.fills.length,
      reconciliationRequired: result.reconciliationRequired,
    });
  }

  async readAccounting(
    workspaceId: string,
    paperAccountId: string,
  ): Promise<RecoveryAccountingSnapshot | null> {
    const checkpoint = await this.accounting.get(workspaceId, paperAccountId);
    if (checkpoint === null) {
      return null;
    }
    return Object.freeze({
      status: checkpoint.status,
      sourceHash: checkpoint.sourceHash,
      rebuiltHash: checkpoint.rebuiltHash,
      reason: checkpoint.reason,
    });
  }

  /**
   * Risk remains optional for US243 Stage 3 compare. Durable Kill Switch /
   * session decision listing belongs to later residuals / E19 — not US291.
   */
  async readRisk(_workspaceId: string, _sessionId: string): Promise<RecoveryRiskSnapshot | null> {
    return null;
  }
}
