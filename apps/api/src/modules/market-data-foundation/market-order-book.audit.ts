import { Injectable } from '@nestjs/common';
import { SecurityAuditService } from '../security-audit/security-audit.service';

export const MARKET_ORDER_BOOK_RETRIEVAL_AUDIT_OUTCOMES = [
  'order_book_retrieval_started',
  'order_book_retrieval_completed',
  'order_book_retrieval_failed',
] as const;

export type MarketOrderBookRetrievalAuditOutcome =
  (typeof MARKET_ORDER_BOOK_RETRIEVAL_AUDIT_OUTCOMES)[number];

/**
 * Order book retrieval audit (W2-S03-e).
 *
 * Reuses Security Audit persistence and the existing connection.validation
 * event type. Does not add event types or redesign the store.
 */
@Injectable()
export class MarketOrderBookRetrievalAudit {
  constructor(private readonly audit: SecurityAuditService) {}

  async record(input: {
    outcome: MarketOrderBookRetrievalAuditOutcome;
    workspaceId: string;
    actorUserId: string;
    connectionId: string;
    provider: string;
    exchangeSymbol?: string;
    depthLimit?: number;
    failureReason?: string;
  }): Promise<void> {
    await this.audit.record({
      eventType: 'connection.validation',
      outcome: input.outcome,
      source: 'market-data-foundation',
      attribution: {
        workspaceId: input.workspaceId,
        actorId: input.actorUserId,
        resourceType: 'connection',
        resourceId: input.connectionId,
      },
      payload: {
        orderBookRetrieval: true,
        provider: input.provider,
        ...(input.exchangeSymbol ? { exchangeSymbol: input.exchangeSymbol } : {}),
        ...(input.depthLimit !== undefined ? { depthLimit: input.depthLimit } : {}),
        ...(input.failureReason ? { failureReason: input.failureReason } : {}),
      },
    });
  }
}
