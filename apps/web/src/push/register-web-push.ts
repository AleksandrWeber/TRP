import { urlBase64ToUint8Array } from './push';

export type WebPushSubscriptionPayload = {
  endpoint: string;
  keys: { p256dh: string; auth: string };
  expirationTime?: number | null;
};

/**
 * Register the Push SW, request notification permission, and subscribe via PushManager.
 * Call only from an explicit Register/Subscribe user action — never on unrelated screens.
 */
export async function registerWebPushSubscription(
  vapidPublicKey: string,
): Promise<WebPushSubscriptionPayload> {
  if (
    typeof window === 'undefined' ||
    !('serviceWorker' in navigator) ||
    !('PushManager' in window)
  ) {
    throw new Error('Web Push is not supported in this browser.');
  }

  const permission = await Notification.requestPermission();
  if (permission !== 'granted') {
    throw new Error('Notification permission was not granted.');
  }

  const registration = await navigator.serviceWorker.register('/push-sw.js');
  await navigator.serviceWorker.ready;

  const applicationServerKey = urlBase64ToUint8Array(vapidPublicKey);
  const subscription = await registration.pushManager.subscribe({
    userVisibleOnly: true,
    // BufferSource cast: DOM lib rejects ArrayBufferLike from Uint8Array generics.
    applicationServerKey: applicationServerKey as BufferSource,
  });

  const json = subscription.toJSON();
  const endpoint = json.endpoint ?? subscription.endpoint;
  const p256dh = json.keys?.p256dh;
  const auth = json.keys?.auth;
  if (!endpoint || !p256dh || !auth) {
    throw new Error('Browser did not return a complete push subscription.');
  }

  return {
    endpoint,
    keys: { p256dh, auth },
    expirationTime: subscription.expirationTime,
  };
}
