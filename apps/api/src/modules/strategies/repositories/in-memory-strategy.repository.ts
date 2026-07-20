import type { Strategy } from '../strategy';
import type { StrategyRepository } from './strategy.repository';

/**
 * In-memory StrategyRepository (Map-backed) (US004/US005).
 * No filesystem, database, or serialization.
 */
export class InMemoryStrategyRepository implements StrategyRepository {
  private readonly byId = new Map<string, Strategy>();

  async save(strategy: Strategy): Promise<void> {
    this.byId.set(strategy.id, clone(strategy));
  }

  async findById(id: string): Promise<Strategy | null> {
    const found = this.byId.get(id);
    return found ? clone(found) : null;
  }

  async findByWorkspaceId(workspaceId: string): Promise<Strategy[]> {
    return [...this.byId.values()]
      .filter((strategy) => strategy.workspaceId === workspaceId)
      .sort(byCreatedAtThenId)
      .map(clone);
  }

  async delete(id: string): Promise<void> {
    this.byId.delete(id);
  }
}

function clone(strategy: Strategy): Strategy {
  return { ...strategy, parameters: structuredClone(strategy.parameters) };
}

function byCreatedAtThenId(left: Strategy, right: Strategy): number {
  const byCreated = left.createdAt.localeCompare(right.createdAt);
  return byCreated !== 0 ? byCreated : left.id.localeCompare(right.id);
}
