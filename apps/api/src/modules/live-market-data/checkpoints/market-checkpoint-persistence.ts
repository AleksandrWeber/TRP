import type { MarketCheckpoint } from '../domain/market-checkpoint';

/**
 * Durable market checkpoint row (US141).
 * `heartbeatAt` is operational liveness only — never semantic progress.
 */
export type DurableMarketCheckpoint = Readonly<
  MarketCheckpoint & {
    heartbeatAt: string | null;
  }
>;

/**
 * Persistence port for durable market stream checkpoints (US141).
 * Implementations must survive process restart (Prisma) or emulate it (tests).
 */
export interface MarketCheckpointPersistence {
  load(workspaceId: string, streamId: string): Promise<DurableMarketCheckpoint | null>;
  listByWorkspace(workspaceId: string): Promise<DurableMarketCheckpoint[]>;
  save(checkpoint: DurableMarketCheckpoint): Promise<void>;
}

export const MARKET_CHECKPOINT_PERSISTENCE = Symbol('MARKET_CHECKPOINT_PERSISTENCE');
