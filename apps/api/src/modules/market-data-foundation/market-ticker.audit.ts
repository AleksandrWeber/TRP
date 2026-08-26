import { Injectable } from '@nestjs/common';
import { SecurityAuditService } from '../security-audit/security-audit.service';

export const MARKET_TICKER_RETRIEVAL_AUDIT_OUTCOMES = [
  'ticker_retrieval_started',
  'ticker_retrieval_completed',
  'ticker_retrieval_failed',
] as const;

export type MarketTickerRetrievalAuditOutcome =
  (typeof MARKET_TICKER_RETRIEVAL_AUDIT_OUTCOMES)[number];

/**
 * Ticker retrieval audit (W2-S03-c).
 *
 * Reuses Security Audit persistence and the existing connection.validation
 * event type. Does not add event types or redesign the store.
 */
@Injectable()
export class MarketTickerRetrievalAudit {
  constructor(private readonly audit: SecurityAuditService) {}

  async record(input: {
    outcome: MarketTickerRetrievalAuditOutcome;
    workspaceId: string;
    actorUserId: string;
    connectionId: string;
    provider: string;
    exchangeSymbol?: string;
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
        tickerRetrieval: true,
        provider: input.provider,
        ...(input.exchangeSymbol ? { exchangeSymbol: input.exchangeSymbol } : {}),
        ...(input.failureReason ? { failureReason: input.failureReason } : {}),
      },
    });
  }
}
