import { Injectable } from '@nestjs/common';
import { SecurityAuditService } from '../security-audit/security-audit.service';

export const PAPER_PORTFOLIO_AUDIT_OUTCOMES = [
  'paper_position_created',
  'paper_position_updated',
  'paper_portfolio_updated',
  'paper_balance_updated',
  'paper_pnl_updated',
] as const;

export type PaperPortfolioAuditOutcome = (typeof PAPER_PORTFOLIO_AUDIT_OUTCOMES)[number];

/**
 * Paper Portfolio / Positions / PnL audit (W2-S04-d).
 * Reuses Security Audit persistence and connection.lifecycle event type.
 */
@Injectable()
export class PaperPortfolioAudit {
  constructor(private readonly audit: SecurityAuditService) {}

  async record(input: {
    outcome: PaperPortfolioAuditOutcome;
    workspaceId: string;
    actorUserId: string;
    paperAccountId: string;
    resourceId?: string;
    exchange?: string;
    symbol?: string;
    cashBalance?: string;
    realizedPnL?: string;
    unrealizedPnL?: string | null;
  }): Promise<void> {
    await this.audit.record({
      eventType: 'connection.lifecycle',
      outcome: input.outcome,
      source: 'paper-trading-foundation',
      attribution: {
        workspaceId: input.workspaceId,
        actorId: input.actorUserId,
        resourceType: 'paper_portfolio',
        resourceId: input.resourceId ?? input.paperAccountId,
      },
      payload: {
        paperPortfolio: true,
        paperAccountId: input.paperAccountId,
        ...(input.exchange ? { exchange: input.exchange } : {}),
        ...(input.symbol ? { symbol: input.symbol } : {}),
        ...(input.cashBalance !== undefined ? { cashBalance: input.cashBalance } : {}),
        ...(input.realizedPnL !== undefined ? { realizedPnL: input.realizedPnL } : {}),
        ...(input.unrealizedPnL !== undefined ? { unrealizedPnL: input.unrealizedPnL } : {}),
      },
    });
  }
}
