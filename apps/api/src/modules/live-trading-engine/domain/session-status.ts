/**
 * Live trading session status (US210).
 */
export const LIVE_SESSION_STATUSES = Object.freeze([
  'CREATED',
  'CONNECTING',
  'CONNECTED',
  'RUNNING',
  'PAUSED',
  'RECONNECTING',
  'STOPPED',
  'FAILED',
  'ARCHIVED',
] as const);

export type LiveSessionStatus = (typeof LIVE_SESSION_STATUSES)[number];

export function isLiveSessionStatus(value: string): value is LiveSessionStatus {
  return (LIVE_SESSION_STATUSES as readonly string[]).includes(value);
}

export function assertLiveSessionStatus(value: string): LiveSessionStatus {
  if (!isLiveSessionStatus(value)) {
    throw new Error(`invalid live session status: ${value}`);
  }
  return value;
}

export const ACTIVE_LIVE_SESSION_STATUSES = Object.freeze([
  'CONNECTING',
  'CONNECTED',
  'RUNNING',
  'PAUSED',
  'RECONNECTING',
] as const);

export function isActiveLiveSessionStatus(status: LiveSessionStatus): boolean {
  return (ACTIVE_LIVE_SESSION_STATUSES as readonly string[]).includes(status);
}

export const TERMINAL_LIVE_SESSION_STATUSES = Object.freeze([
  'STOPPED',
  'FAILED',
  'ARCHIVED',
] as const);

export function isTerminalLiveSessionStatus(status: LiveSessionStatus): boolean {
  return (TERMINAL_LIVE_SESSION_STATUSES as readonly string[]).includes(status);
}
