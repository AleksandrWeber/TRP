import { BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { AuthUser } from '../auth/jwt.strategy';
import { Role } from '../identity/role';
import { InMemoryWorkspaceRepository } from '../workspace/repositories/in-memory-workspace.repository';
import { WorkspaceAccessService } from '../workspace/workspace-access.service';
import { WorkspaceDomainService } from '../workspace/workspace-domain.service';
import {
  NotificationChannelsController,
  NotificationDeliveriesController,
  NotificationPreferencesController,
  NotificationSettingsController,
} from './notification.controller';
import type { NotificationProductService } from './notification-product.service';
import type {
  NotificationChannelPageView,
  NotificationDeliveryDetailView,
  NotificationDeliveryPageView,
  NotificationPreferencesView,
  NotificationSettingsView,
} from './notification.view';

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

const emptySettings = {
  deferredChannelsActivated: false as const,
  generatesReports: false as const,
  controlPlane: false as const,
  authorityClass: 'notification-projection' as const,
};

describe('Notification controllers (PC-06)', () => {
  let settings: NotificationSettingsController;
  let preferences: NotificationPreferencesController;
  let channels: NotificationChannelsController;
  let deliveries: NotificationDeliveriesController;
  let workspaceId: string;
  let foreignWorkspaceId: string;
  let product: {
    getSettings: ReturnType<typeof vi.fn>;
    getPreferences: ReturnType<typeof vi.fn>;
    upsertPreferences: ReturnType<typeof vi.fn>;
    listChannels: ReturnType<typeof vi.fn>;
    getChannelsWorkspace: ReturnType<typeof vi.fn>;
    getChannel: ReturnType<typeof vi.fn>;
    getChannelDiagnostics: ReturnType<typeof vi.fn>;
    listChannelDeliveries: ReturnType<typeof vi.fn>;
    listDeliveries: ReturnType<typeof vi.fn>;
    getDelivery: ReturnType<typeof vi.fn>;
    getRouting: ReturnType<typeof vi.fn>;
  };

  beforeEach(async () => {
    const workspaces = new WorkspaceDomainService(new InMemoryWorkspaceRepository());
    const access = new WorkspaceAccessService(workspaces);
    workspaceId = (await workspaces.create({ name: 'Lab', ownerUserId: owner.userId })).id;
    foreignWorkspaceId = (await workspaces.create({ name: 'Other', ownerUserId: other.userId })).id;
    product = {
      getSettings: vi.fn(
        (): NotificationSettingsView =>
          ({
            ...emptySettings,
            preferences: { enabled: true } as NotificationPreferencesView,
            channels: [],
            telegram: { connected: false, connectAvailable: false },
            routing: { controlPlane: false },
            scheduleClock: { scheduler: false },
          }) as unknown as NotificationSettingsView,
      ),
      getPreferences: vi.fn(
        (): NotificationPreferencesView =>
          ({ enabled: true }) as unknown as NotificationPreferencesView,
      ),
      upsertPreferences: vi.fn(
        (): NotificationPreferencesView =>
          ({ enabled: false }) as unknown as NotificationPreferencesView,
      ),
      listChannels: vi.fn((): NotificationChannelPageView => ({
        items: [],
        deferredChannelsActivated: false,
        authorityClass: 'notification-projection',
      })),
      getChannelsWorkspace: vi.fn(() => ({
        channels: [],
        deferredChannelsActivated: false,
        controlPlane: false,
        authorityClass: 'notification-projection',
      })),
      getChannel: vi.fn(() => null),
      getChannelDiagnostics: vi.fn(() => null),
      listChannelDeliveries: vi.fn((): NotificationDeliveryPageView => ({
        items: [],
        authorityClass: 'notification-projection',
        generatesReports: false,
      })),
      listDeliveries: vi.fn((): NotificationDeliveryPageView => ({
        items: [],
        authorityClass: 'notification-projection',
        generatesReports: false,
      })),
      getDelivery: vi.fn((): NotificationDeliveryDetailView | null => null),
      getRouting: vi.fn(),
    };
    settings = new NotificationSettingsController(
      product as unknown as NotificationProductService,
      access,
    );
    preferences = new NotificationPreferencesController(
      product as unknown as NotificationProductService,
      access,
    );
    channels = new NotificationChannelsController(
      product as unknown as NotificationProductService,
      access,
    );
    deliveries = new NotificationDeliveriesController(
      product as unknown as NotificationProductService,
      access,
    );
  });

  it('requires a workspace header', () => {
    expect(() => settings.get({ user: owner }, undefined)).toThrow(BadRequestException);
    expect(() => preferences.get({ user: owner }, undefined)).toThrow(BadRequestException);
    expect(() => channels.list({ user: owner }, undefined)).toThrow(BadRequestException);
    expect(() => deliveries.list({ user: owner }, undefined, {})).toThrow(BadRequestException);
  });

  it('rejects a foreign workspace', () => {
    expect(() => settings.get({ user: owner }, foreignWorkspaceId)).toThrow(ForbiddenException);
  });

  it('reads settings and 404s unknown deliveries', () => {
    const page = settings.get({ user: owner }, workspaceId);
    expect(page.authorityClass).toBe('notification-projection');
    expect(product.getSettings).toHaveBeenCalledWith(workspaceId, owner.userId);
    expect(() => deliveries.get({ user: owner }, workspaceId, { deliveryId: 'missing' })).toThrow(
      NotFoundException,
    );
  });

  it('upserts preferences for the current user', () => {
    const next = preferences.upsert({ user: owner }, workspaceId, { enabled: false });
    expect(next.enabled).toBe(false);
    expect(product.upsertPreferences).toHaveBeenCalledWith(
      expect.objectContaining({ workspaceId, userId: owner.userId, enabled: false }),
    );
  });

  it('reads channel workspace and 404s unknown channel details', () => {
    const page = channels.workspace({ user: owner }, workspaceId);
    expect(page.authorityClass).toBe('notification-projection');
    expect(product.getChannelsWorkspace).toHaveBeenCalledWith(workspaceId, owner.userId);
    expect(() => channels.get({ user: owner }, workspaceId, { channelId: 'email' })).toThrow(
      NotFoundException,
    );
  });
});
