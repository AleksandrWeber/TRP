/**
 * Web Push subscription registry service (CM-16).
 *
 * Validates endpoints (syntactic + public DNS) before persist. Never returns
 * private keys or full encryption material on public views.
 */

import { Inject, Injectable, Optional } from '@nestjs/common';
import {
  validateWebPushEndpointOutbound,
  WEB_PUSH_DNS_RESOLVE,
  type WebPushDnsResolveFn,
} from '../../security-platform/web-push-endpoint-guard';
import {
  toWebPushSubscriptionPublicView,
  type UpsertWebPushSubscriptionInput,
  type WebPushSubscription,
  type WebPushSubscriptionPublicView,
} from './domain/web-push-subscription';
import {
  WEB_PUSH_SUBSCRIPTION_REPOSITORY,
  type WebPushSubscriptionRepository,
} from './domain/web-push-subscription.repository';

@Injectable()
export class WebPushSubscriptionService {
  private readonly resolveDns: WebPushDnsResolveFn | undefined;

  constructor(
    @Optional()
    @Inject(WEB_PUSH_SUBSCRIPTION_REPOSITORY)
    private readonly repo?: WebPushSubscriptionRepository,
    @Optional()
    @Inject(WEB_PUSH_DNS_RESOLVE)
    resolveDns?: WebPushDnsResolveFn,
  ) {
    this.resolveDns = resolveDns;
  }

  async listActive(workspaceId: string, userId: string): Promise<readonly WebPushSubscription[]> {
    if (!this.repo) return Object.freeze([]);
    return this.repo.listActive(workspaceId, userId);
  }

  async listActivePublic(
    workspaceId: string,
    userId: string,
  ): Promise<readonly WebPushSubscriptionPublicView[]> {
    const rows = await this.listActive(workspaceId, userId);
    return Object.freeze(rows.map(toWebPushSubscriptionPublicView));
  }

  async upsert(input: UpsertWebPushSubscriptionInput): Promise<WebPushSubscriptionPublicView> {
    if (!this.repo) {
      throw new Error('Web Push subscription registry is unavailable');
    }
    const guard = await validateWebPushEndpointOutbound(input.endpoint, {
      ...(this.resolveDns ? { resolveDns: this.resolveDns } : {}),
    });
    if (!guard.ok) {
      throw new Error('Web Push endpoint is not allowed');
    }
    const p256dh = input.p256dh.trim();
    const auth = input.auth.trim();
    if (!p256dh || !auth || p256dh.length < 16 || auth.length < 8) {
      throw new Error('Web Push subscription keys are invalid');
    }
    const saved = await this.repo.upsert({
      ...input,
      endpoint: guard.preservedUrl,
      p256dh,
      auth,
    });
    return toWebPushSubscriptionPublicView(saved);
  }

  async revokeById(
    workspaceId: string,
    userId: string,
    id: string,
  ): Promise<WebPushSubscriptionPublicView | null> {
    if (!this.repo) return null;
    const revoked = await this.repo.revokeById(workspaceId, userId, id);
    return revoked ? toWebPushSubscriptionPublicView(revoked) : null;
  }

  async revokeAllForUser(workspaceId: string, userId: string): Promise<number> {
    if (!this.repo) return 0;
    return this.repo.revokeAllForUser(workspaceId, userId);
  }

  async markExpired(workspaceId: string, id: string, lastErrorCode?: string): Promise<void> {
    if (!this.repo) return;
    await this.repo.markExpired(workspaceId, id, lastErrorCode);
  }

  async markSuccess(workspaceId: string, id: string, at = new Date()): Promise<void> {
    if (!this.repo) return;
    await this.repo.markSuccess(workspaceId, id, at);
  }
}
