export const CONNECTION_STATUSES = Object.freeze([
  'DISCONNECTED',
  'CONNECTING',
  'CONNECTED',
  'RECONNECTING',
  'ERROR',
] as const);

export type ConnectionStatus = (typeof CONNECTION_STATUSES)[number];

export function isConnectionStatus(value: string): value is ConnectionStatus {
  return (CONNECTION_STATUSES as readonly string[]).includes(value);
}

export function assertConnectionStatus(value: string): ConnectionStatus {
  if (!isConnectionStatus(value)) {
    throw new Error(`invalid connection status: ${value}`);
  }
  return value;
}
