import type { Strategy } from '../strategy';

/**
 * Persistence contract for Strategy aggregates (US004).
 * Storage operations only — workspace isolation is enforced by the
 * StrategyDomainService, which never returns cross-workspace rows.
 */
export interface StrategyRepository {
  save(strategy: Strategy): Promise<void>;
  findById(id: string): Promise<Strategy | null>;
  findByWorkspaceId(workspaceId: string): Promise<Strategy[]>;
  delete(id: string): Promise<void>;
}
