/**
 * Application events for US204 Portfolio Engine.
 * Persisted via PortfolioEventPublisher; also collected in-memory for tests.
 */

export const PORTFOLIO_EVENT_TYPES = Object.freeze([
  'PortfolioCreated',
  'PortfolioUpdated',
  'BalanceChanged',
  'EquityChanged',
  'MarginChanged',
  'SnapshotCreated',
  'PortfolioArchived',
] as const);

export type PortfolioEventType = (typeof PORTFOLIO_EVENT_TYPES)[number];

type PortfolioEventBase<Type extends PortfolioEventType> = Readonly<{
  eventType: Type;
  portfolioId: string;
  occurredAt: string;
}>;

export type PortfolioCreatedEvent = PortfolioEventBase<'PortfolioCreated'> &
  Readonly<{
    ownerId: string;
    currency: string;
    cash: string;
  }>;

export type PortfolioUpdatedEvent = PortfolioEventBase<'PortfolioUpdated'> &
  Readonly<{
    status: string;
  }>;

export type BalanceChangedEvent = PortfolioEventBase<'BalanceChanged'> &
  Readonly<{
    cash: string;
  }>;

export type EquityChangedEvent = PortfolioEventBase<'EquityChanged'> &
  Readonly<{
    equity: string;
    realizedPnL: string;
    unrealizedPnL: string;
  }>;

export type MarginChangedEvent = PortfolioEventBase<'MarginChanged'> &
  Readonly<{
    usedMargin: string;
    availableMargin: string;
  }>;

export type SnapshotCreatedEvent = PortfolioEventBase<'SnapshotCreated'> &
  Readonly<{
    snapshotId: string;
  }>;

export type PortfolioArchivedEvent = PortfolioEventBase<'PortfolioArchived'>;

export type PortfolioDomainEvent =
  | PortfolioCreatedEvent
  | PortfolioUpdatedEvent
  | BalanceChangedEvent
  | EquityChangedEvent
  | MarginChangedEvent
  | SnapshotCreatedEvent
  | PortfolioArchivedEvent;
