export function telegramStatusLabel(status: string): string {
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

export function telegramVerificationLabel(connection: {
  verified: boolean;
  pending: boolean;
  connected: boolean;
}): string {
  if (connection.verified) return 'Verified';
  if (connection.pending) return 'Awaiting bind';
  return 'Not verified';
}
