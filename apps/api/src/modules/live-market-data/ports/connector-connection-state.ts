/**
 * Observable connector connection lifecycle (US131 / US133 / US134).
 */
export enum ConnectorConnectionState {
  DISCONNECTED = 'disconnected',
  CONNECTING = 'connecting',
  CONNECTED = 'connected',
  SUBSCRIBING = 'subscribing',
  READY = 'ready',
  /** Unexpected disconnect; bounded backoff in progress (US134). */
  RECONNECTING = 'reconnecting',
  /**
   * Socket restored and subscriptions re-armed, but gap recovery is not done.
   * Reconnect alone must not report READY/healthy (US134).
   */
  RECOVERING = 'recovering',
  DISCONNECTING = 'disconnecting',
  FAILED = 'failed',
}

export function isConnectorConnectionState(value: string): value is ConnectorConnectionState {
  return (Object.values(ConnectorConnectionState) as string[]).includes(value);
}
