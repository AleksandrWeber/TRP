import { createHash } from 'node:crypto';
import type { LedgerAccountSummary } from '../../ledger/domain/ledger-account-summary';
import { FinancialDecimal } from '../../financial';
import type { PositionValuation } from './position-valuation';

export const PORTFOLIO_PROJECTION_SCHEMA_VERSION = 1;

export type PortfolioProjection = Readonly<{
  id: string;
  workspaceId: string;
  paperAccountId: string;
  currency: string;
  availableCash: string;
  reservedCash: string;
  cash: string;
  marketValue: string;
  equity: string;
  realizedPnl: string;
  unrealizedPnl: string;
  totalPnl: string;
  fees: string;
  exposure: string;
  ledgerVersion: number;
  valuationCheckpoint: string;
  sourceHash: string;
  version: number;
  complete: boolean;
  stalePositionIds: readonly string[];
  valuedAt: string | null;
  recordedAt: string;
}>;

/** Ledger-driven, read-only Portfolio fold (US176 / ADR-015). */
export function projectPortfolio(
  ledger: LedgerAccountSummary,
  valuations: readonly PositionValuation[],
  current: PortfolioProjection | null,
  recordedAt: string,
): PortfolioProjection {
  assertIso(recordedAt);
  const ordered = [...valuations].sort((a, b) => a.positionId.localeCompare(b.positionId));
  for (const valuation of ordered) {
    if (
      valuation.workspaceId !== ledger.workspaceId ||
      valuation.paperAccountId !== ledger.paperAccountId
    ) {
      throw new Error('Position valuation does not belong to Portfolio identity');
    }
  }

  const marketValue = sum(ordered.map((value) => value.marketValue));
  const unrealizedPnl = sum(ordered.map((value) => value.unrealizedPnl));
  const valuationCost = sum(ordered.map((value) => value.costBasis));
  const valuationRealized = sum(ordered.map((value) => value.realizedPnl));
  const fees = FinancialDecimal.from(ledger.fees);
  const grossRealized = FinancialDecimal.from(ledger.realizedPnl);
  const realizedPnl = grossRealized.minus(fees);
  const totalPnl = realizedPnl.plus(unrealizedPnl);
  const cash = FinancialDecimal.from(ledger.cash);
  const equity = cash.plus(marketValue);
  const complete =
    valuationCost.equals(ledger.positionCost) && valuationRealized.equals(grossRealized);
  if (complete && !FinancialDecimal.from(ledger.openingCapital).plus(totalPnl).equals(equity)) {
    throw new Error('Portfolio opening capital and total PnL identity is violated');
  }

  const valuationCheckpoint = createHash('sha256')
    .update(ordered.map((value) => `${value.positionId}:${value.version}`).join('|'))
    .digest('hex');
  const sourceHash = createHash('sha256')
    .update(`${ledger.checkpoint}|${valuationCheckpoint}|${complete}`)
    .digest('hex');
  const valuedAt =
    ordered
      .map((value) => value.occurredAt)
      .sort()
      .at(-1) ?? null;
  return Object.freeze({
    id: `portfolio:${ledger.workspaceId}:${ledger.paperAccountId}`,
    workspaceId: ledger.workspaceId,
    paperAccountId: ledger.paperAccountId,
    currency: ledger.currency,
    availableCash: FinancialDecimal.from(ledger.availableCash).toString(),
    reservedCash: FinancialDecimal.from(ledger.reservedCash).toString(),
    cash: cash.toString(),
    marketValue: marketValue.toString(),
    equity: equity.toString(),
    realizedPnl: realizedPnl.toString(),
    unrealizedPnl: unrealizedPnl.toString(),
    totalPnl: totalPnl.toString(),
    fees: fees.toString(),
    exposure: marketValue.toString(),
    ledgerVersion: ledger.version,
    valuationCheckpoint,
    sourceHash,
    version: (current?.version ?? 0) + 1,
    complete,
    stalePositionIds: Object.freeze([]),
    valuedAt,
    recordedAt,
  });
}

function sum(values: readonly string[]): FinancialDecimal {
  return values.reduce((total, value) => total.plus(value), FinancialDecimal.zero());
}

function assertIso(value: string): void {
  if (Number.isNaN(Date.parse(value)) || new Date(value).toISOString() !== value) {
    throw new Error('recordedAt must be an ISO-8601 UTC timestamp');
  }
}
