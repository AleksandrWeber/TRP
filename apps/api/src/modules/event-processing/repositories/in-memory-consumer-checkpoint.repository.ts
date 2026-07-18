import { toConsumerId, type ConsumerId } from '../domain/consumer-id';
import type { ConsumerCheckpoint } from '../domain/consumer-checkpoint';
import type { ConsumerCheckpointRepository } from './consumer-checkpoint.repository';

/**
 * In-memory consumer checkpoint store (US129).
 * Checkpoints survive process-local "restart" by remaining in the repository instance
 * (and Prisma persistence in production).
 */
export class InMemoryConsumerCheckpointRepository implements ConsumerCheckpointRepository {
  private readonly byKey = new Map<string, ConsumerCheckpoint>();

  async get(consumerId: ConsumerId | string, streamId: string): Promise<ConsumerCheckpoint | null> {
    return this.byKey.get(key(consumerId, streamId)) ?? null;
  }

  async save(checkpoint: ConsumerCheckpoint): Promise<ConsumerCheckpoint> {
    const frozen = Object.freeze({
      ...checkpoint,
      consumerId: toConsumerId(String(checkpoint.consumerId)),
    });
    this.byKey.set(key(checkpoint.consumerId, checkpoint.streamId), frozen);
    return frozen;
  }

  async listByConsumer(consumerId: ConsumerId | string): Promise<ConsumerCheckpoint[]> {
    return Array.from(this.byKey.values())
      .filter((row) => row.consumerId === consumerId)
      .map((row) => Object.freeze({ ...row }));
  }

  clear(): void {
    this.byKey.clear();
  }

  /** Simulate restart by cloning into a new repository instance. */
  clone(): InMemoryConsumerCheckpointRepository {
    const copy = new InMemoryConsumerCheckpointRepository();
    for (const [k, value] of this.byKey.entries()) {
      copy.byKey.set(k, value);
    }
    return copy;
  }
}

function key(consumerId: ConsumerId | string, streamId: string): string {
  return `${consumerId}::${streamId}`;
}
