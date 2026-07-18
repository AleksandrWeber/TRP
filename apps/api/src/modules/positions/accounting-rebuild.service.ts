import { Inject, Injectable } from '@nestjs/common';
import { createHash } from 'node:crypto';
import { FillQueryService, type PaperFill } from '../execution-engine';
import type { PaperFillConfiguration } from '../execution-adapter';
import { LedgerService } from '../ledger';
import { applyFillToPosition, type Position } from './domain/position';
import { projectPortfolio, type PortfolioProjection } from './domain/portfolio-projection';
import { PORTFOLIO_REPOSITORY, type PortfolioRepository } from './persistence/portfolio.repository';
import { POSITION_REPOSITORY, type PositionRepository } from './persistence/position.repository';
import {
  POSITION_VALUATION_REPOSITORY,
  type PositionValuationRepository,
} from './persistence/position-valuation.repository';
import { POSITION_FILL_CONFIGURATION } from './positions.tokens';
import {
  AccountingReconciliationService,
  type AccountingReconciliation,
} from './reconciliation/accounting-reconciliation.service';

@Injectable()
export class AccountingRebuildService {
  constructor(
    @Inject(FillQueryService)
    private readonly fills: FillQueryService,
    @Inject(POSITION_REPOSITORY)
    private readonly positions: PositionRepository,
    @Inject(POSITION_VALUATION_REPOSITORY)
    private readonly valuations: PositionValuationRepository,
    @Inject(PORTFOLIO_REPOSITORY)
    private readonly portfolios: PortfolioRepository,
    @Inject(LedgerService)
    private readonly ledger: LedgerService,
    @Inject(POSITION_FILL_CONFIGURATION)
    private readonly configuration: PaperFillConfiguration,
    @Inject(AccountingReconciliationService)
    private readonly reconciliations: AccountingReconciliationService,
  ) {}

  /**
   * Rebuilds in memory and compares. Only the reconciliation checkpoint is
   * written; immutable Fills/Ledger and live projections are never reapplied.
   */
  async reconcile(
    workspaceId: string,
    paperAccountId: string,
    checkedAt: string,
  ): Promise<AccountingReconciliation> {
    const [fills, livePositions, valuations, livePortfolio, ledger] = await Promise.all([
      this.fills.listByAccount(workspaceId, paperAccountId),
      this.positions.listByAccount(workspaceId, paperAccountId),
      this.valuations.listByAccount(workspaceId, paperAccountId),
      this.portfolios.find(workspaceId, paperAccountId),
      this.ledger.summarizeAccount(workspaceId, paperAccountId),
    ]);
    const rebuiltPositions = rebuildPositions(fills, this.configuration, checkedAt);
    const rebuiltPortfolio = projectPortfolio(ledger, valuations, null, checkedAt);
    const sourceHash = accountingHash(livePositions, livePortfolio);
    const rebuiltHash = accountingHash(rebuiltPositions, rebuiltPortfolio);
    const reason = !livePortfolio
      ? 'Portfolio projection is missing'
      : !rebuiltPortfolio.complete
        ? 'Position valuation checkpoint is incomplete'
        : sourceHash !== rebuiltHash
          ? 'Live accounting projections differ from deterministic rebuild'
          : null;
    return this.reconciliations.record(
      workspaceId,
      paperAccountId,
      sourceHash,
      rebuiltHash,
      reason,
      checkedAt,
    );
  }
}

export function rebuildPositions(
  fills: readonly PaperFill[],
  configuration: PaperFillConfiguration,
  recordedAt: string,
): Position[] {
  const positions = new Map<string, Position>();
  const ordered = [...fills].sort(
    (a, b) =>
      a.occurredAt.localeCompare(b.occurredAt) ||
      a.recordedAt.localeCompare(b.recordedAt) ||
      a.id.localeCompare(b.id),
  );
  for (const fill of ordered) {
    const key = `${fill.workspaceId}:${fill.paperAccountId}:${fill.instrument}`;
    const transition = applyFillToPosition(
      positions.get(key) ?? null,
      fill,
      configuration.precision,
      recordedAt,
    );
    positions.set(key, transition.position);
  }
  return [...positions.values()].sort((a, b) => a.instrument.localeCompare(b.instrument));
}

function accountingHash(
  positions: readonly Position[],
  portfolio: PortfolioProjection | null,
): string {
  const positionState = [...positions]
    .sort((a, b) => a.instrument.localeCompare(b.instrument))
    .map((position) => ({
      id: position.id,
      instrument: position.instrument,
      side: position.side,
      quantity: position.quantity,
      averageEntryPrice: position.averageEntryPrice,
      costBasis: position.costBasis,
      realizedPnl: position.realizedPnl,
      version: position.version,
      lastAppliedFillId: position.lastAppliedFillId,
      lastAppliedFillSequence: position.lastAppliedFillSequence,
    }));
  const portfolioState = portfolio
    ? {
        availableCash: portfolio.availableCash,
        reservedCash: portfolio.reservedCash,
        cash: portfolio.cash,
        marketValue: portfolio.marketValue,
        equity: portfolio.equity,
        realizedPnl: portfolio.realizedPnl,
        unrealizedPnl: portfolio.unrealizedPnl,
        totalPnl: portfolio.totalPnl,
        fees: portfolio.fees,
        exposure: portfolio.exposure,
        ledgerVersion: portfolio.ledgerVersion,
        valuationCheckpoint: portfolio.valuationCheckpoint,
        sourceHash: portfolio.sourceHash,
        complete: portfolio.complete,
      }
    : null;
  return createHash('sha256')
    .update(JSON.stringify({ positions: positionState, portfolio: portfolioState }))
    .digest('hex');
}
