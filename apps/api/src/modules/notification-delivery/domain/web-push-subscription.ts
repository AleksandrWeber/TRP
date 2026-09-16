/**
 * Durable Web Push subscription registry (CM-16).
 *
 * Not an anchor. Endpoints and encryption keys are sensitive — never echo in
 * product responses or diagnostics after create.
 */

export const WEB_PUSH_SUBSCRIPTION_STATUSES = Object.freeze([
  'active',
  'revoked',
  'expired',
] as const);

export type WebPushSubscriptionStatus = (typeof WEB_PUSH_SUBSCRIPTION_STATUSES)[number];

export type WebPushSubscription = Readonly<{
  id: string;
  workspaceId: string;
  userId: string;
  providerKind: 'web-push';
  endpoint: string;
  p256dh: string;
  auth: string;
  status: WebPushSubscriptionStatus;
  userAgent?: string;
  lastErrorCode?: string;
  lastSuccessAt?: string;
  createdAt: string;
  updatedAt: string;
}>;

export type UpsertWebPushSubscriptionInput = Readonly<{
  workspaceId: string;
  userId: string;
  endpoint: string;
  p256dh: string;
  auth: string;
  userAgent?: string;
}>;

export type WebPushSubscriptionPublicView = Readonly<{
  id: string;
  status: WebPushSubscriptionStatus;
  createdAt: string;
  /** Hostname only — never the full endpoint path/token. */
  endpointHost?: string;
}>;

export function toWebPushSubscriptionPublicView(
  subscription: WebPushSubscription,
): WebPushSubscriptionPublicView {
  let endpointHost: string | undefined;
  try {
    endpointHost = new URL(subscription.endpoint).hostname;
  } catch {
    endpointHost = undefined;
  }
  return Object.freeze({
    id: subscription.id,
    status: subscription.status,
    createdAt: subscription.createdAt,
    ...(endpointHost ? { endpointHost } : {}),
  });
}
