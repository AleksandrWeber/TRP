import type { DurableEventEnvelope } from './durable-event-envelope';
import type { ConsumerCheckpoint } from './consumer-checkpoint';
import type { InboxRecord } from './inbox-record';

export type ConsumerApplyResult =
  | {
      outcome: 'applied';
      inbox: InboxRecord;
      checkpoint: ConsumerCheckpoint;
      projection: unknown;
    }
  | {
      outcome: 'duplicate';
      inbox: InboxRecord;
      checkpoint: ConsumerCheckpoint | null;
    }
  | {
      outcome: 'deferred_gap';
      checkpoint: ConsumerCheckpoint;
      expectedSequence: number;
      receivedSequence: number;
    }
  | {
      outcome: 'stale';
      checkpoint: ConsumerCheckpoint;
      lastAppliedSequence: number;
      receivedSequence: number;
    };

export type ConsumerProjectionHandler<TProjection> = {
  consumerId: string;
  consumerVersion: string;
  /**
   * Apply business projection for a new event.
   * Must be idempotent at the business level; Inbox provides transport idempotency.
   */
  apply(event: DurableEventEnvelope, current: TProjection | null): TProjection;
  getProjection(workspaceId: string, streamId: string): TProjection | null;
  saveProjection(workspaceId: string, streamId: string, projection: TProjection): void;
  clearProjection?(workspaceId: string, streamId: string): void;
};
