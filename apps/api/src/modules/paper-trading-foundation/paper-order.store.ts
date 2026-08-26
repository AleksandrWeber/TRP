import type { PaperOrder } from './paper-order';

export const PAPER_ORDER_STORE = Symbol('PAPER_ORDER_STORE');

export interface PaperOrderStore {
  create(order: PaperOrder): Promise<PaperOrder>;
  save(order: PaperOrder): Promise<PaperOrder>;
  findById(workspaceId: string, orderId: string): Promise<PaperOrder | null>;
  listByWorkspace(workspaceId: string): Promise<readonly PaperOrder[]>;
}

export class InMemoryPaperOrderStore implements PaperOrderStore {
  private readonly byId = new Map<string, PaperOrder>();

  async create(order: PaperOrder): Promise<PaperOrder> {
    const key = keyOf(order.workspaceId, order.id);
    if (this.byId.has(key)) {
      throw new Error('paper order already exists');
    }
    this.byId.set(key, order);
    return order;
  }

  async save(order: PaperOrder): Promise<PaperOrder> {
    const key = keyOf(order.workspaceId, order.id);
    if (!this.byId.has(key)) {
      throw new Error('paper order not found');
    }
    this.byId.set(key, order);
    return order;
  }

  async findById(workspaceId: string, orderId: string): Promise<PaperOrder | null> {
    return this.byId.get(keyOf(workspaceId, orderId)) ?? null;
  }

  async listByWorkspace(workspaceId: string): Promise<readonly PaperOrder[]> {
    return [...this.byId.values()]
      .filter((order) => order.workspaceId === workspaceId)
      .sort((a, b) => a.createdAt.localeCompare(b.createdAt));
  }

  clear(): void {
    this.byId.clear();
  }
}

function keyOf(workspaceId: string, orderId: string): string {
  return `${workspaceId}:${orderId}`;
}
