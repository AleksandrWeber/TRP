export type DomainEvent = {
  id: string;
  type: string;
  timestamp: string;
  correlationId?: string;
  payload: Record<string, unknown>;
};

export type EventHandler = (event: DomainEvent) => void | Promise<void>;
