import type { Prisma, PrismaClient } from '@prisma/client';
import type {
  UpsertWebPushSubscriptionInput,
  WebPushSubscription,
  WebPushSubscriptionStatus,
} from '../domain/web-push-subscription';
import type { WebPushSubscriptionRepository } from '../domain/web-push-subscription.repository';

type Row = Prisma.WorkspaceWebPushSubscriptionGetPayload<Record<string, never>>;

export class PrismaWebPushSubscriptionRepository implements WebPushSubscriptionRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async listActive(workspaceId: string, userId: string): Promise<readonly WebPushSubscription[]> {
    const rows = await this.prisma.workspaceWebPushSubscription.findMany({
      where: {
        workspaceId: workspaceId.trim(),
        userId: userId.trim(),
        status: 'active',
      },
      orderBy: { createdAt: 'asc' },
    });
    return Object.freeze(rows.map(toDomain));
  }

  async upsert(input: UpsertWebPushSubscriptionInput): Promise<WebPushSubscription> {
    const workspaceId = input.workspaceId.trim();
    const userId = input.userId.trim();
    const endpoint = input.endpoint.trim();
    const now = new Date();
    const row = await this.prisma.workspaceWebPushSubscription.upsert({
      where: {
        workspaceId_userId_endpoint: { workspaceId, userId, endpoint },
      },
      create: {
        workspaceId,
        userId,
        providerKind: 'web-push',
        endpoint,
        p256dh: input.p256dh,
        auth: input.auth,
        status: 'active',
        userAgent: input.userAgent?.trim() || null,
        createdAt: now,
        updatedAt: now,
      },
      update: {
        p256dh: input.p256dh,
        auth: input.auth,
        status: 'active',
        userAgent: input.userAgent?.trim() || null,
        lastErrorCode: null,
        updatedAt: now,
      },
    });
    return toDomain(row);
  }

  async revokeById(
    workspaceId: string,
    userId: string,
    id: string,
  ): Promise<WebPushSubscription | null> {
    const existing = await this.prisma.workspaceWebPushSubscription.findFirst({
      where: {
        id: id.trim(),
        workspaceId: workspaceId.trim(),
        userId: userId.trim(),
      },
    });
    if (!existing) return null;
    const row = await this.prisma.workspaceWebPushSubscription.update({
      where: { id: existing.id },
      data: { status: 'revoked', updatedAt: new Date() },
    });
    return toDomain(row);
  }

  async revokeAllForUser(workspaceId: string, userId: string): Promise<number> {
    const result = await this.prisma.workspaceWebPushSubscription.updateMany({
      where: {
        workspaceId: workspaceId.trim(),
        userId: userId.trim(),
        status: 'active',
      },
      data: { status: 'revoked', updatedAt: new Date() },
    });
    return result.count;
  }

  async markExpired(workspaceId: string, id: string, lastErrorCode?: string): Promise<void> {
    await this.prisma.workspaceWebPushSubscription.updateMany({
      where: {
        id: id.trim(),
        workspaceId: workspaceId.trim(),
      },
      data: {
        status: 'expired',
        ...(lastErrorCode?.trim() ? { lastErrorCode: lastErrorCode.trim() } : {}),
        updatedAt: new Date(),
      },
    });
  }

  async markSuccess(workspaceId: string, id: string, at: Date): Promise<void> {
    await this.prisma.workspaceWebPushSubscription.updateMany({
      where: {
        id: id.trim(),
        workspaceId: workspaceId.trim(),
      },
      data: {
        lastSuccessAt: at,
        lastErrorCode: null,
        updatedAt: at,
      },
    });
  }

  async findById(
    workspaceId: string,
    userId: string,
    id: string,
  ): Promise<WebPushSubscription | null> {
    const row = await this.prisma.workspaceWebPushSubscription.findFirst({
      where: {
        id: id.trim(),
        workspaceId: workspaceId.trim(),
        userId: userId.trim(),
      },
    });
    return row ? toDomain(row) : null;
  }
}

function toDomain(row: Row): WebPushSubscription {
  return Object.freeze({
    id: row.id,
    workspaceId: row.workspaceId,
    userId: row.userId,
    providerKind: 'web-push' as const,
    endpoint: row.endpoint,
    p256dh: row.p256dh,
    auth: row.auth,
    status: row.status as WebPushSubscriptionStatus,
    ...(row.userAgent ? { userAgent: row.userAgent } : {}),
    ...(row.lastErrorCode ? { lastErrorCode: row.lastErrorCode } : {}),
    ...(row.lastSuccessAt ? { lastSuccessAt: row.lastSuccessAt.toISOString() } : {}),
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  });
}
