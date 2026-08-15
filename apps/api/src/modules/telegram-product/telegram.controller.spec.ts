import { BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { AuthUser } from '../auth/jwt.strategy';
import { Role } from '../identity/role';
import { InMemoryWorkspaceRepository } from '../workspace/repositories/in-memory-workspace.repository';
import { WorkspaceAccessService } from '../workspace/workspace-access.service';
import { WorkspaceDomainService } from '../workspace/workspace-domain.service';
import { TelegramController } from './telegram.controller';
import type { TelegramProductService } from './telegram-product.service';
import type {
  TelegramConnectProductView,
  TelegramConnectionProductView,
  TelegramDeliveryPageView,
  TelegramDiagnosticsView,
  TelegramTestProductView,
} from './telegram.view';

const owner: AuthUser = {
  userId: 'user-1',
  email: 'user@example.com',
  displayName: 'User',
  role: Role.Researcher,
};

const other: AuthUser = {
  userId: 'user-2',
  email: 'other@example.com',
  displayName: 'Other',
  role: Role.Researcher,
};

const connection: TelegramConnectionProductView = {
  status: 'not-connected',
  connected: false,
  chatBound: false,
  pending: false,
  verified: false,
  connectedAt: null,
  updatedAt: '2026-08-15T19:00:00.000Z',
  deepLink: null,
  connectAvailable: true,
  completeAvailable: false,
  verifyAvailable: false,
  testAvailable: false,
  disconnectAvailable: false,
  controlPlane: false,
  transport: 'in-memory',
  botApiUsed: false,
  userEnteredBind: false,
  authorityClass: 'notification-projection',
};

describe('Telegram controller (PC-07)', () => {
  let controller: TelegramController;
  let workspaceId: string;
  let foreignWorkspaceId: string;
  let product: {
    getConnection: ReturnType<typeof vi.fn>;
    connect: ReturnType<typeof vi.fn>;
    complete: ReturnType<typeof vi.fn>;
    verify: ReturnType<typeof vi.fn>;
    disconnect: ReturnType<typeof vi.fn>;
    sendTest: ReturnType<typeof vi.fn>;
    getDiagnostics: ReturnType<typeof vi.fn>;
    listDeliveries: ReturnType<typeof vi.fn>;
    getDelivery: ReturnType<typeof vi.fn>;
  };

  beforeEach(async () => {
    const workspaces = new WorkspaceDomainService(new InMemoryWorkspaceRepository());
    const access = new WorkspaceAccessService(workspaces);
    workspaceId = (await workspaces.create({ name: 'Lab', ownerUserId: owner.userId })).id;
    foreignWorkspaceId = (await workspaces.create({ name: 'Other', ownerUserId: other.userId })).id;
    product = {
      getConnection: vi.fn((): TelegramConnectionProductView => connection),
      connect: vi.fn((): TelegramConnectProductView => ({
        connection: { ...connection, status: 'pending', pending: true, connectAvailable: false },
        deepLink: 'tg://connect/tg-token',
        controlPlane: false,
        botApiUsed: false,
        userEnteredBind: false,
        authorityClass: 'notification-projection',
      })),
      complete: vi.fn(),
      verify: vi.fn((): TelegramConnectionProductView => connection),
      disconnect: vi.fn((): TelegramConnectionProductView => connection),
      sendTest: vi.fn(
        (): TelegramTestProductView =>
          ({
            connection,
            delivery: { deliveryId: 'del-1' },
            controlPlane: false,
            botApiUsed: false,
            authorityClass: 'notification-projection',
          }) as TelegramTestProductView,
      ),
      getDiagnostics: vi.fn(
        (): TelegramDiagnosticsView =>
          ({
            connection,
            botApiUsed: false,
            controlPlane: false,
          }) as TelegramDiagnosticsView,
      ),
      listDeliveries: vi.fn((): TelegramDeliveryPageView => ({
        items: [],
        authorityClass: 'notification-projection',
        generatesReports: false,
      })),
      getDelivery: vi.fn(() => null),
    };
    controller = new TelegramController(product as unknown as TelegramProductService, access);
  });

  it('requires a workspace header', () => {
    expect(() => controller.status({ user: owner }, undefined)).toThrow(BadRequestException);
    expect(() => controller.connect({ user: owner }, undefined)).toThrow(BadRequestException);
    expect(() => controller.sendTest({ user: owner }, undefined)).toThrow(BadRequestException);
  });

  it('rejects a foreign workspace', () => {
    expect(() => controller.status({ user: owner }, foreignWorkspaceId)).toThrow(
      ForbiddenException,
    );
  });

  it('connects, reads status, and 404s unknown telegram deliveries', () => {
    const page = controller.status({ user: owner }, workspaceId);
    expect(page.authorityClass).toBe('notification-projection');
    expect(product.getConnection).toHaveBeenCalledWith(workspaceId, owner.userId);

    const connect = controller.connect({ user: owner }, workspaceId);
    expect(connect.deepLink).toContain('tg://connect/');
    expect(connect.userEnteredBind).toBe(false);
    expect(product.connect).toHaveBeenCalledWith(workspaceId, owner.userId);

    expect(() =>
      controller.getDelivery({ user: owner }, workspaceId, { deliveryId: 'missing' }),
    ).toThrow(NotFoundException);
  });

  it('maps complete bind errors to 400', () => {
    product.complete.mockImplementation(() => {
      throw new Error('Telegram connection is not awaiting bind');
    });
    expect(() => controller.complete({ user: owner }, workspaceId)).toThrow(BadRequestException);
  });
});
