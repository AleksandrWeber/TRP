import type { AcceptedMarketStreamState } from '../domain/accepted-market-stream-state';
import type { DurableEventEnvelope } from '../domain/durable-event-envelope';
import type { InMemoryOutboxRepository } from './in-memory-outbox.repository';
import type {
  AcceptMarketEventCommand,
  AcceptMarketEventResult,
  TransactionalOutboxWriter,
} from '../transactional-outbox-writer';

/**
 * In-memory transactional Outbox writer (US128).
 * Persists accepted market-stream state and Outbox row atomically:
 * any failure after staging rolls both back.
 */
export class InMemoryTransactionalOutboxWriter implements TransactionalOutboxWriter {
  private readonly states = new Map<string, AcceptedMarketStreamState>();

  constructor(private readonly outbox: InMemoryOutboxRepository) {}

  async acceptMarketEvent(command: AcceptMarketEventCommand): Promise<AcceptMarketEventResult> {
    return this.commit(command);
  }

  /**
   * Same as acceptMarketEvent, with an optional post-write hook.
   * If the hook throws, both state and Outbox are rolled back.
   */
  async acceptMarketEventOrRollback(
    command: AcceptMarketEventCommand,
    afterWrite?: () => void,
  ): Promise<AcceptMarketEventResult> {
    return this.commit(command, afterWrite);
  }

  async getAcceptedState(
    workspaceId: string,
    streamId: string,
  ): Promise<AcceptedMarketStreamState | null> {
    return this.states.get(stateKey(workspaceId, streamId)) ?? null;
  }

  private async commit(
    command: AcceptMarketEventCommand,
    afterWrite?: () => void,
  ): Promise<AcceptMarketEventResult> {
    assertEnvelope(command.envelope);

    const key = stateKey(command.state.workspaceId, command.state.streamId);
    const previousState = this.states.get(key);
    const hadPreviousOutbox = (await this.outbox.findByEventId(command.envelope.eventId)) !== null;
    let outboxInserted = false;
    let stateWritten = false;

    try {
      if (hadPreviousOutbox) {
        throw new Error(`outbox event already exists: ${command.envelope.eventId}`);
      }

      const outbox = await this.outbox.insert(command.envelope, command.recordedAt);
      outboxInserted = true;

      const state = Object.freeze({ ...command.state });
      this.states.set(key, state);
      stateWritten = true;

      afterWrite?.();

      return { state, outbox };
    } catch (error) {
      if (stateWritten) {
        if (previousState === undefined) {
          this.states.delete(key);
        } else {
          this.states.set(key, previousState);
        }
      }
      if (outboxInserted && !hadPreviousOutbox) {
        await this.outbox.remove(command.envelope.eventId);
      }
      throw error;
    }
  }
}

function stateKey(workspaceId: string, streamId: string): string {
  return `${workspaceId}::${streamId}`;
}

function assertEnvelope(envelope: DurableEventEnvelope): void {
  const required: Array<keyof DurableEventEnvelope> = [
    'eventId',
    'eventType',
    'schemaVersion',
    'aggregateType',
    'aggregateId',
    'aggregateVersion',
    'workspaceId',
    'occurredAt',
    'recordedAt',
    'payload',
  ];
  for (const field of required) {
    const value = envelope[field];
    if (value === undefined || value === null || value === '') {
      throw new Error(`durable envelope missing required field: ${field}`);
    }
  }
  if (envelope.schemaVersion < 1) {
    throw new Error('schemaVersion must be greater than or equal to 1');
  }
  if (!Number.isInteger(envelope.aggregateVersion) || envelope.aggregateVersion < 0) {
    throw new Error('aggregateVersion must be a non-negative integer');
  }
}
