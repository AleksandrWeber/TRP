export function pushStatusLabel(status: string): string {
  switch (status) {
    case 'connected':
      return 'Connected';
    case 'pending':
      return 'Pending';
    case 'not-connected':
      return 'Not connected';
    default:
      return status;
  }
}

export function pushVerificationLabel(connection: {
  verified: boolean;
  failed: boolean;
  pending: boolean;
}): string {
  if (connection.verified) return 'Verified';
  if (connection.failed) return 'Failed';
  if (connection.pending) return 'Pending verification';
  return 'Not verified';
}

/** Decode a URL-safe base64 VAPID public key for PushManager.subscribe. */
export function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; i += 1) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}
