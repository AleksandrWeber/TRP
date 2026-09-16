/**
 * Web Push subscription registry repository port (CM-16).
 */

import type { UpsertWebPushSubscriptionInput, WebPushSubscription } from './web-push-subscription';

export const WEB_PUSH_SUBSCRIPTION_REPOSITORY = Symbol('WEB_PUSH_SUBSCRIPTION_REPOSITORY');

export interface WebPushSubscriptionRepository {
  listActive(workspaceId: string, userId: string): Promise<readonly WebPushSubscription[]>;
  upsert(input: UpsertWebPushSubscriptionInput): Promise<WebPushSubscription>;
  revokeById(workspaceId: string, userId: string, id: string): Promise<WebPushSubscription | null>;
  revokeAllForUser(workspaceId: string, userId: string): Promise<number>;
  markExpired(workspaceId: string, id: string, lastErrorCode?: string): Promise<void>;
  markSuccess(workspaceId: string, id: string, at: Date): Promise<void>;
  findById(workspaceId: string, userId: string, id: string): Promise<WebPushSubscription | null>;
}
