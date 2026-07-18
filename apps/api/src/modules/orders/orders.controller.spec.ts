import { ForbiddenException } from '@nestjs/common';
import { describe, expect, it, vi } from 'vitest';
import { ROLES_KEY } from '../auth/decorators/roles.decorator';
import type { AuthUser } from '../auth/jwt.strategy';
import { Role } from '../identity/role';
import { OrderSide, OrderType } from './domain/order-intent';
import { OrdersController } from './orders.controller';

const trader: AuthUser = {
  userId: 'trader-164',
  email: 'trader@example.test',
  displayName: 'Trader',
  role: Role.Trader,
};

describe('US164 — authorized Order command and query API', () => {
  function harness() {
    const orders = {
      create: vi.fn(async (command) => command),
      cancel: vi.fn(async (command) => command),
      get: vi.fn(async () => ({ id: 'order-164' })),
      list: vi.fn(async () => [{ id: 'order-164' }]),
      transition: vi.fn(),
    };
    const commandAuthorization = {
      authorizeTradingCommand: vi.fn((input) => ({
        actorId: input.user.userId,
        workspaceId: input.workspaceId,
        role: input.user.role,
        correlationId: input.correlationId ?? null,
        idempotencyKey: input.idempotencyKey ?? null,
      })),
    };
    const workspaceAccess = { assertMember: vi.fn() };
    return {
      controller: new OrdersController(
        orders as never,
        commandAuthorization as never,
        workspaceAccess as never,
      ),
      orders,
      commandAuthorization,
      workspaceAccess,
    };
  }

  it('maps an authorized HTTP create command only to a paper/manual Order proposal', async () => {
    const { controller, orders, commandAuthorization } = harness();
    await controller.create({ user: trader }, 'ws-164', 'create-164', 'corr-164', {
      clientOrderId: 'client-164',
      paperAccountId: 'account-164',
      tradingSessionId: 'session-164',
      sessionFencingToken: 4,
      instrument: 'BTCUSDT',
      side: OrderSide.BUY,
      type: OrderType.MARKET,
      quantity: '1.25',
      reduceOnly: false,
      marketCheckpoint: { streamId: 'book', sequence: 9, eventId: 'event-164' },
    });

    expect(commandAuthorization.authorizeTradingCommand).toHaveBeenCalledWith(
      expect.objectContaining({ workspaceId: 'ws-164', idempotencyKey: 'create-164' }),
    );
    expect(orders.create).toHaveBeenCalledWith(
      expect.objectContaining({
        workspaceId: 'ws-164',
        mode: 'paper',
        origin: 'manual',
        actorId: trader.userId,
      }),
    );
    expect(orders.transition).not.toHaveBeenCalled();
  });

  it('maps cancellation only to Orders cancellation and never to an internal transition/adapter path', async () => {
    const { controller, orders } = harness();
    await controller.cancel({ user: trader }, 'order-164', 'ws-164', 'cancel-164', 'corr-164');
    expect(orders.cancel).toHaveBeenCalledWith(
      expect.objectContaining({
        workspaceId: 'ws-164',
        orderId: 'order-164',
        idempotencyKey: 'cancel-164',
      }),
    );
    expect(orders.transition).not.toHaveBeenCalled();
  });

  it('workspace-scopes reads and denies callers outside the workspace', async () => {
    const { controller, orders, workspaceAccess } = harness();
    await controller.list({ user: trader }, 'ws-164');
    expect(workspaceAccess.assertMember).toHaveBeenCalledWith('ws-164', trader.userId);
    expect(orders.list).toHaveBeenCalledWith('ws-164');

    workspaceAccess.assertMember.mockImplementationOnce(() => {
      throw new Error('denied');
    });
    await expect(
      controller.get({ user: trader }, 'foreign-order', 'foreign-ws'),
    ).rejects.toBeInstanceOf(ForbiddenException);
    expect(orders.get).not.toHaveBeenCalled();
  });

  it('requires Trader or Administrator role metadata for command endpoints', () => {
    expect(Reflect.getMetadata(ROLES_KEY, OrdersController.prototype.create)).toEqual([
      Role.Trader,
      Role.Admin,
    ]);
    expect(Reflect.getMetadata(ROLES_KEY, OrdersController.prototype.cancel)).toEqual([
      Role.Trader,
      Role.Admin,
    ]);
  });
});
