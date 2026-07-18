import { createHash } from 'node:crypto';
import { FinancialDecimal } from '../../financial';
import {
  LedgerAccount,
  LedgerCauseType,
  LedgerDirection,
  type LedgerTransaction,
} from './ledger-transaction';

export type LedgerAccountSummary = Readonly<{
  workspaceId: string;
  paperAccountId: string;
  currency: string;
  availableCash: string;
  reservedCash: string;
  cash: string;
  positionCost: string;
  fees: string;
  realizedPnl: string;
  openingCapital: string;
  version: number;
  checkpoint: string;
  lastRecordedAt: string | null;
}>;

/** Deterministic fold over the append-only authoritative Ledger (US176/US177). */
export function summarizeLedger(
  workspaceId: string,
  paperAccountId: string,
  transactions: readonly LedgerTransaction[],
): LedgerAccountSummary {
  const ordered = [...transactions].sort(compareTransactions);
  const currency = ordered[0]?.currency ?? '';
  const totals = new Map<LedgerAccount, FinancialDecimal>();
  let openingCapital = FinancialDecimal.zero();
  for (const transaction of ordered) {
    if (
      transaction.workspaceId !== workspaceId ||
      transaction.paperAccountId !== paperAccountId ||
      (currency && transaction.currency !== currency)
    ) {
      throw new Error('Ledger transaction does not belong to account summary');
    }
    for (const entry of transaction.entries) {
      const signed =
        entry.direction === LedgerDirection.DEBIT
          ? FinancialDecimal.from(entry.amount)
          : FinancialDecimal.from(entry.amount).times('-1');
      totals.set(
        entry.account,
        (totals.get(entry.account) ?? FinancialDecimal.zero()).plus(signed),
      );
      if (
        transaction.causeType === LedgerCauseType.OPENING_CAPITAL &&
        entry.account === LedgerAccount.ADJUSTMENT_COMPENSATION
      ) {
        openingCapital =
          entry.direction === LedgerDirection.CREDIT
            ? openingCapital.plus(entry.amount)
            : openingCapital.minus(entry.amount);
      }
    }
  }
  const availableCash = total(totals, LedgerAccount.AVAILABLE_CASH);
  const reservedCash = total(totals, LedgerAccount.RESERVED_CASH);
  const fees = total(totals, LedgerAccount.FEES);
  const realizedDebitBalance = total(totals, LedgerAccount.REALIZED_PNL);
  const checkpoint = createHash('sha256')
    .update(ordered.map((transaction) => transaction.id).join('|'))
    .digest('hex');
  return Object.freeze({
    workspaceId,
    paperAccountId,
    currency,
    availableCash: availableCash.toString(),
    reservedCash: reservedCash.toString(),
    cash: availableCash.plus(reservedCash).toString(),
    positionCost: total(totals, LedgerAccount.POSITION_COST).toString(),
    fees: fees.toString(),
    realizedPnl: realizedDebitBalance.times('-1').toString(),
    openingCapital: openingCapital.toString(),
    version: ordered.length,
    checkpoint,
    lastRecordedAt: ordered.at(-1)?.recordedAt ?? null,
  });
}

function total(
  totals: ReadonlyMap<LedgerAccount, FinancialDecimal>,
  account: LedgerAccount,
): FinancialDecimal {
  return totals.get(account) ?? FinancialDecimal.zero();
}

function compareTransactions(a: LedgerTransaction, b: LedgerTransaction): number {
  return a.occurredAt.localeCompare(b.occurredAt) || a.id.localeCompare(b.id);
}
