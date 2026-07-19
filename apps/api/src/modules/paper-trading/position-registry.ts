import { Injectable } from '@nestjs/common';
import { createPaperPosition, type PaperPosition } from './domain/paper-position';

/**
 * Process-local paper-position store (US010).
 * Workspace ids are storage scope only and deliberately stay out of the
 * PaperPosition domain contract returned by the API.
 */
@Injectable()
export class PositionRegistry {
  private readonly positionsByWorkspace = new Map<string, Map<string, PaperPosition>>();

  add(workspaceId: string, position: PaperPosition): PaperPosition {
    const positions = this.workspacePositions(workspaceId);
    if (positions.has(position.id)) {
      throw new Error(`PaperPosition already registered: ${position.id}`);
    }
    if (this.getOpenByStrategy(workspaceId, position.strategyId)) {
      throw new Error(`Open PaperPosition already exists for strategy: ${position.strategyId}`);
    }
    const stored = createPaperPosition(position);
    positions.set(stored.id, stored);
    return stored;
  }

  close(workspaceId: string, positionId: string): PaperPosition {
    const positions = this.positionsByWorkspace.get(workspaceId);
    const existing = positions?.get(positionId);
    if (!existing) {
      throw new Error(`PaperPosition not found: ${positionId}`);
    }
    if (existing.status === 'CLOSED') {
      throw new Error(`PaperPosition already closed: ${positionId}`);
    }
    const closed = createPaperPosition({ ...existing, status: 'CLOSED' });
    positions?.set(positionId, closed);
    return closed;
  }

  getOpenByStrategy(workspaceId: string, strategyId: string): PaperPosition | null {
    return (
      this.list(workspaceId).find(
        (position) => position.strategyId === strategyId && position.status === 'OPEN',
      ) ?? null
    );
  }

  list(workspaceId: string): ReadonlyArray<PaperPosition> {
    const positions = this.positionsByWorkspace.get(workspaceId);
    return Object.freeze(positions ? [...positions.values()] : []);
  }

  clear(): void {
    this.positionsByWorkspace.clear();
  }

  private workspacePositions(workspaceId: string): Map<string, PaperPosition> {
    let positions = this.positionsByWorkspace.get(workspaceId);
    if (!positions) {
      positions = new Map<string, PaperPosition>();
      this.positionsByWorkspace.set(workspaceId, positions);
    }
    return positions;
  }
}
