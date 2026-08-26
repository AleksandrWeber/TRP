import { Injectable } from '@nestjs/common';
import { SecurityAuditService } from '../security-audit/security-audit.service';

export const MARKET_SYMBOL_DISCOVERY_AUDIT_OUTCOMES = [
  'symbol_discovery_started',
  'symbol_discovery_completed',
  'symbol_discovery_failed',
] as const;

export type MarketSymbolDiscoveryAuditOutcome =
  (typeof MARKET_SYMBOL_DISCOVERY_AUDIT_OUTCOMES)[number];

/**
 * Symbol discovery audit (W2-S03-b).
 *
 * Reuses Security Audit persistence and the existing connection.validation
 * event type. Does not add event types or redesign the store.
 */
@Injectable()
export class MarketSymbolDiscoveryAudit {
  constructor(private readonly audit: SecurityAuditService) {}

  async record(input: {
    outcome: MarketSymbolDiscoveryAuditOutcome;
    workspaceId: string;
    actorUserId: string;
    connectionId: string;
    provider: string;
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
        symbolDiscovery: true,
        provider: input.provider,
        ...(input.failureReason ? { failureReason: input.failureReason } : {}),
      },
    });
  }
}
