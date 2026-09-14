export function emailStatusLabel(status: string): string {
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

export function emailVerificationLabel(connection: {
  verified: boolean;
  pending: boolean;
  connected: boolean;
  recipientBound: boolean;
}): string {
  if (connection.verified) return 'Verified';
  if (connection.pending && connection.recipientBound) return 'Recipient bound — test required';
  return 'Not verified';
}
