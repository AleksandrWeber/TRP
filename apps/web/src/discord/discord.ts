export function discordStatusLabel(status: string): string {
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

export function discordVerificationLabel(connection: {
  verified: boolean;
  failed: boolean;
  pending: boolean;
}): string {
  if (connection.verified) return 'Verified';
  if (connection.failed) return 'Failed';
  if (connection.pending) return 'Pending verification';
  return 'Not verified';
}
