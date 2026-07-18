import type { ConsumerId } from '../domain/consumer-id';
import type { ConsumerCheckpoint } from '../domain/consumer-checkpoint';

export interface ConsumerCheckpointRepository {
  get(consumerId: ConsumerId | string, streamId: string): Promise<ConsumerCheckpoint | null>;
  save(checkpoint: ConsumerCheckpoint): Promise<ConsumerCheckpoint>;
  listByConsumer(consumerId: ConsumerId | string): Promise<ConsumerCheckpoint[]>;
}
