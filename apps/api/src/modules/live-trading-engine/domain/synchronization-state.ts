/**
 * Live session synchronization state (US210).
 */
export const SYNCHRONIZATION_STATES = Object.freeze([
  'SYNCED',
  'SYNCING',
  'OUT_OF_SYNC',
  'RECOVERING',
] as const);

export type SynchronizationState = (typeof SYNCHRONIZATION_STATES)[number];

export function isSynchronizationState(value: string): value is SynchronizationState {
  return (SYNCHRONIZATION_STATES as readonly string[]).includes(value);
}

export function assertSynchronizationState(value: string): SynchronizationState {
  if (!isSynchronizationState(value)) {
    throw new Error(`invalid synchronization state: ${value}`);
  }
  return value;
}
