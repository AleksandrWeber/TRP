/**
 * Observable connector connection lifecycle (US131 / US133).
 */
export enum ConnectorConnectionState {
  DISCONNECTED = 'disconnected',
  CONNECTING = 'connecting',
  CONNECTED = 'connected',
  SUBSCRIBING = 'subscribing',
  READY = 'ready',
  DISCONNECTING = 'disconnecting',
  FAILED = 'failed',
}

export function isConnectorConnectionState(value: string): value is ConnectorConnectionState {
  return (Object.values(ConnectorConnectionState) as string[]).includes(value);
}
