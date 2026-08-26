import { Injectable } from '@nestjs/common';
import { SecurityAuditService } from '../security-audit/security-audit.service';

export const MARKET_CANDLE_RETRIEVAL_AUDIT_OUTCOMES = [
  'candlestick_retrieval_started',
  'candlestick_retrieval_completed',
  'candlestick_retrieval_failed',
] as const;

export type MarketCandleRetrievalAuditOutcome =
  (typeof MARKET_CANDLE_RETRIEVAL_AUDIT_OUTCOMES)[number];

/**
 * Candlestick retrieval audit (W2-S03-d).
 *
 * Reuses Security Audit persistence and the existing connection.validation
 * event type. Does not add event types or redesign the store.
 */
@Injectable()
export class MarketCandleRetrievalAudit {
  constructor(private readonly audit: SecurityAuditService) {}

  async record(input: {
    outcome: MarketCandleRetrievalAuditOutcome;
    workspaceId: string;
    actorUserId: string;
    connectionId: string;
    provider: string;
    exchangeSymbol?: string;
    interval?: string;
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
        candlestickRetrieval: true,
        provider: input.provider,
        ...(input.exchangeSymbol ? { exchangeSymbol: input.exchangeSymbol } : {}),
        ...(input.interval ? { interval: input.interval } : {}),
        ...(input.failureReason ? { failureReason: input.failureReason } : {}),
      },
    });
  }
}
