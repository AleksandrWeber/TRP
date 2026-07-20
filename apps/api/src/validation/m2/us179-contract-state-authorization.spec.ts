/**
 * US179 — M2 contract, state-machine, RBAC, and authorization validation.
 * Pure validation only: no external service or production mutation.
 */
import { describe, expect, it } from 'vitest';
import { CommandAuthorizationService } from '../../modules/auth/command-authorization.service';
import type { AuthUser } from '../../modules/auth/jwt.strategy';
import { M2_PAPER_FILL_CONFIGURATION } from '../../modules/execution-adapter';
import { PaperExecutionAdapter } from '../../modules/execution-adapter/paper-execution.adapter';
import { FinancialDecimal } from '../../modules/financial';
import { Role } from '../../modules/identity/role';
import {
  createOrder,
  transitionOrder,
  type OrderTransitionInput,
} from '../../modules/orders/domain/order';
import { createOrderIntent, OrderSide, OrderType } from '../../modules/orders/domain/order-intent';
import { OrderStatus } from '../../modules/orders/domain/order-status';
import { OrdersController } from '../../modules/orders/orders.controller';
import { RiskDecisionStatus } from '../../modules/risk';
import {
  createTradingSession,
  transitionSession,
} from '../../modules/trading-session/domain/trading-session';
import { TradingSessionStatus } from '../../modules/trading-session/domain/trading-session-status';
import { InMemoryWorkspaceRepository } from '../../modules/workspace/repositories/in-memory-workspace.repository';
import { WorkspaceAccessService } from '../../modules/workspace/workspace-access.service';
import { WorkspaceDomainService } from '../../modules/workspace/workspace-domain.service';

const t0 = '2026-07-18T20:30:00.000Z';

describe('US179 — contracts, state machines, RBAC, and authorization', () => {
  it('rejects binary floats and non-paper execution commands at canonical boundaries', async () => {
    expect(() => FinancialDecimal.from(0.1 as never)).toThrow(/string/);

    const adapter = new PaperExecutionAdapter();
    await expect(
      adapter.submit({
        mode: 'live',
        workspaceId: 'workspace-1',
        orderId: 'order-1',
        clientOrderId: 'client-1',
        intentHash: 'intent-1',
        instrument: 'BTCUSDT',
        side: 'buy',
        type: 'market',
        quantity: '1',
        limitPrice: null,
        marketState: {
          streamId: 'mark-1',
          eventId: 'event-1',
          sequence: 1,
          referencePrice: '100',
          occurredAt: t0,
        },
        configuration: M2_PAPER_FILL_CONFIGURATION,
      } as never),
    ).rejects.toThrow(/paper/);
    expect(adapter.capabilities()).toMatchObject({
      mode: 'paper',
      liveCapital: false,
    });
    expect(adapter.health().credentialsConfigured).toBe(false);
  });

  it('rejects forbidden Session and Order transitions and terminal reopening', () => {
    const session = createTradingSession({
      id: 'session-1',
      workspaceId: 'workspace-1',
      paperAccountId: 'account-1',
      deploymentId: 'manual-1',
      origin: 'manual',
      actorId: 'trader-1',
      idempotencyKey: 'session-1',
      createdAt: t0,
      recordedAt: t0,
    });
    expect(() => transitionSession(session, TradingSessionStatus.RUNNING, t0)).toThrow(
      /invalid trading session transition/,
    );

    const proposed = createOrder(
      createOrderIntent({
        clientOrderId: 'client-1',
        idempotencyKey: 'order-1',
        workspaceId: 'workspace-1',
        paperAccountId: 'account-1',
        tradingSessionId: 'session-1',
        sessionFencingToken: 1,
        mode: 'paper',
        origin: 'manual',
        instrument: 'BTCUSDT',
        side: OrderSide.BUY,
        type: OrderType.MARKET,
        quantity: '1',
        marketCheckpoint: { streamId: 'mark-1', sequence: 1, eventId: 'event-1' },
        actorId: 'trader-1',
        occurredAt: t0,
        recordedAt: t0,
      }),
    );
    expect(() => move(proposed, OrderStatus.SUBMITTED)).toThrow(/invalid order transition/);

    const pending = move(proposed, OrderStatus.RISK_PENDING);
    const rejected = move(pending, OrderStatus.REJECTED, { reason: 'risk rejected' });
    expect(() => move(rejected, OrderStatus.CANCEL_PENDING)).toThrow(/terminal/);
    expect(() =>
      move(pending, OrderStatus.APPROVED, {
        riskDecision: {
          id: 'risk-foreign',
          status: RiskDecisionStatus.APPROVED,
          workspaceId: 'foreign-workspace',
          orderId: pending.id,
          intentHash: pending.intent.intentHash,
          policyId: 'm2-baseline-paper-risk',
          policyVersion: 1,
          policyHash: 'policy',
          inputHash: 'input',
          evaluatedAt: t0,
          expiresAt: '2026-07-18T21:30:00.000Z',
        },
      }),
    ).toThrow(/exact approved Risk Decision/);
  });

  it('allows Trader/Admin only in their workspace and exposes no lifecycle bypass route', async () => {
    const workspaces = new WorkspaceDomainService(new InMemoryWorkspaceRepository());
    const access = new WorkspaceAccessService(workspaces);
    const authorization = new CommandAuthorizationService(access);
    const workspace = await workspaces.create({ name: 'M2', ownerUserId: 'owner-1' });
    const foreign = await workspaces.create({ name: 'Foreign', ownerUserId: 'owner-2' });

    expect(
      authorization.authorizeTradingCommand({
        user: user(Role.Trader),
        workspaceId: String(workspace.id),
        idempotencyKey: 'command-1',
      }).actorId,
    ).toBe('owner-1');
    expect(() =>
      authorization.authorizeTradingCommand({
        user: user(Role.Reader),
        workspaceId: String(workspace.id),
      }),
    ).toThrow(/Trader or Administrator/);
    expect(() =>
      authorization.authorizeTradingCommand({
        user: user(Role.Admin),
        workspaceId: String(foreign.id),
      }),
    ).toThrow(/workspace access denied/);

    expect(OrdersController.prototype).not.toHaveProperty('approve');
    expect(OrdersController.prototype).not.toHaveProperty('submit');
    expect(OrdersController.prototype).not.toHaveProperty('fill');
  });
});

function move(
  order: ReturnType<typeof createOrder>,
  toStatus: OrderStatus,
  extra: Partial<OrderTransitionInput> = {},
) {
  return transitionOrder(order, {
    toStatus,
    eventType: `Order${toStatus}`,
    actorId: 'orders',
    occurredAt: '2026-07-18T20:30:01.000Z',
    recordedAt: '2026-07-18T20:30:01.100Z',
    ...extra,
  });
}

function user(role: Role): AuthUser {
  return {
    userId: 'owner-1',
    email: 'owner@example.com',
    displayName: 'Owner',
    role,
  };
}
