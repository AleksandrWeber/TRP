import type { ConsumerId } from './consumer-id';

export enum ConsumerCheckpointStatus {
  READY = 'ready',
  BLOCKED_GAP = 'blocked_gap',
  ERROR = 'error',
}

export function isConsumerCheckpointStatus(value: string): value is ConsumerCheckpointStatus {
  return (Object.values(ConsumerCheckpointStatus) as string[]).includes(value);
}

/**
 * Durable consumer stream checkpoint (US129 / ADR-013).
 * Survives restart; records last applied sequence and blocked-gap state.
 */
export type ConsumerCheckpoint = Readonly<{
  consumerId: ConsumerId;
  consumerVersion: string;
  streamId: string;
  workspaceId: string;
  lastAppliedSequence: number;
  lastAppliedEventId: string | null;
  status: ConsumerCheckpointStatus;
  blockedSequence: number | null;
  lastError: string | null;
  updatedAt: string;
}>;
