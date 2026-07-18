import type {
  DurableMarketCheckpoint,
  MarketCheckpointPersistence,
} from './market-checkpoint-persistence';

/**
 * In-memory MarketCheckpointPersistence for tests (US141).
 * `clone()` simulates process restart over the same durable rows.
 */
export class InMemoryMarketCheckpointPersistence implements MarketCheckpointPersistence {
  constructor(private readonly rows = new Map<string, DurableMarketCheckpoint>()) {}

  async load(workspaceId: string, streamId: string): Promise<DurableMarketCheckpoint | null> {
    return this.rows.get(key(workspaceId, streamId)) ?? null;
  }

  async listByWorkspace(workspaceId: string): Promise<DurableMarketCheckpoint[]> {
    return [...this.rows.values()].filter((row) => row.workspaceId === workspaceId);
  }

  async save(checkpoint: DurableMarketCheckpoint): Promise<void> {
    this.rows.set(key(checkpoint.workspaceId, String(checkpoint.streamId)), checkpoint);
  }

  /** New instance over the same underlying rows — restart simulation. */
  clone(): InMemoryMarketCheckpointPersistence {
    return new InMemoryMarketCheckpointPersistence(this.rows);
  }
}

function key(workspaceId: string, streamId: string): string {
  return `${workspaceId}::${streamId}`;
}
