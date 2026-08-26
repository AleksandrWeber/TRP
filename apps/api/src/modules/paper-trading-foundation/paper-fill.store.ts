import type { PaperFill } from './paper-fill';

export const PAPER_FILL_STORE = Symbol('PAPER_FILL_STORE');

export interface PaperFillStore {
  create(fill: PaperFill): Promise<PaperFill>;
  findById(workspaceId: string, fillId: string): Promise<PaperFill | null>;
  listByWorkspace(workspaceId: string): Promise<readonly PaperFill[]>;
  findByOrderId(workspaceId: string, paperOrderId: string): Promise<PaperFill | null>;
}

export class InMemoryPaperFillStore implements PaperFillStore {
  private readonly byId = new Map<string, PaperFill>();

  async create(fill: PaperFill): Promise<PaperFill> {
    const key = keyOf(fill.workspaceId, fill.id);
    if (this.byId.has(key)) throw new Error('paper fill already exists');
    const existingForOrder = [...this.byId.values()].find(
      (item) => item.workspaceId === fill.workspaceId && item.paperOrderId === fill.paperOrderId,
    );
    if (existingForOrder) throw new Error('paper order already has a fill');
    this.byId.set(key, fill);
    return fill;
  }

  async findById(workspaceId: string, fillId: string): Promise<PaperFill | null> {
    return this.byId.get(keyOf(workspaceId, fillId)) ?? null;
  }

  async listByWorkspace(workspaceId: string): Promise<readonly PaperFill[]> {
    return [...this.byId.values()]
      .filter((fill) => fill.workspaceId === workspaceId)
      .sort((a, b) => a.createdAt.localeCompare(b.createdAt));
  }

  async findByOrderId(workspaceId: string, paperOrderId: string): Promise<PaperFill | null> {
    return (
      [...this.byId.values()].find(
        (fill) => fill.workspaceId === workspaceId && fill.paperOrderId === paperOrderId,
      ) ?? null
    );
  }

  clear(): void {
    this.byId.clear();
  }
}

function keyOf(workspaceId: string, fillId: string): string {
  return `${workspaceId}:${fillId}`;
}
