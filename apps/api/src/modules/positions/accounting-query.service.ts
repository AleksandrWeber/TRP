import { Inject, Injectable } from '@nestjs/common';
import { FillQueryService } from '../execution-engine';
import { LedgerService } from '../ledger';
import { PaperAccountService } from '../paper-account';
import { PORTFOLIO_REPOSITORY, type PortfolioRepository } from './persistence/portfolio.repository';
import { POSITION_REPOSITORY, type PositionRepository } from './persistence/position.repository';
import {
  POSITION_VALUATION_REPOSITORY,
  type PositionValuationRepository,
} from './persistence/position-valuation.repository';
import { AccountingReconciliationService } from './reconciliation/accounting-reconciliation.service';

@Injectable()
export class AccountingQueryService {
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
    @Inject(PaperAccountService)
    private readonly accounts: PaperAccountService,
    @Inject(AccountingReconciliationService)
    private readonly reconciliations: AccountingReconciliationService,
  ) {}

  async fillView(workspaceId: string, paperAccountId: string) {
    await this.assertAccount(workspaceId, paperAccountId);
    const fills = await this.fills.listByAccount(workspaceId, paperAccountId);
    return Object.freeze({
      dataClass: 'immutable_execution_facts',
      projection: false,
      items: fills.map((fill) =>
        Object.freeze({
          id: fill.id,
          orderId: fill.orderId,
          instrument: fill.instrument,
          side: fill.side,
          price: fill.price,
          quantity: fill.quantity,
          grossNotional: fill.grossNotional,
          fee: fill.fee,
          sequence: fill.sequence,
          occurredAt: fill.occurredAt,
          recordedAt: fill.recordedAt,
        }),
      ),
    });
  }

  async positionView(workspaceId: string, paperAccountId: string) {
    await this.assertAccount(workspaceId, paperAccountId);
    const [positions, valuations] = await Promise.all([
      this.positions.listByAccount(workspaceId, paperAccountId),
      this.valuations.listByAccount(workspaceId, paperAccountId),
    ]);
    return Object.freeze({
      dataClass: 'position_projection',
      projection: true,
      authoritative: false,
      positions,
      valuations,
    });
  }

  async ledgerView(workspaceId: string, paperAccountId: string) {
    await this.assertAccount(workspaceId, paperAccountId);
    const transactions = await this.ledger.listByAccount(workspaceId, paperAccountId);
    return Object.freeze({
      dataClass: 'authoritative_ledger',
      projection: false,
      authoritative: true,
      transactions: transactions.map((transaction) =>
        Object.freeze({
          id: transaction.id,
          causeType: transaction.causeType,
          causeId: transaction.causeId,
          currency: transaction.currency,
          occurredAt: transaction.occurredAt,
          recordedAt: transaction.recordedAt,
          entries: transaction.entries,
          compensationReason: transaction.compensationReason,
        }),
      ),
    });
  }

  async portfolioView(workspaceId: string, paperAccountId: string) {
    await this.assertAccount(workspaceId, paperAccountId);
    const portfolio = await this.portfolios.find(workspaceId, paperAccountId);
    return Object.freeze({
      dataClass: 'portfolio_projection',
      projection: true,
      authoritative: false,
      portfolio,
    });
  }

  async reconciliationView(workspaceId: string, paperAccountId: string) {
    await this.assertAccount(workspaceId, paperAccountId);
    return Object.freeze({
      dataClass: 'accounting_reconciliation_checkpoint',
      projection: true,
      authoritative: false,
      reconciliation: await this.reconciliations.get(workspaceId, paperAccountId),
    });
  }

  private async assertAccount(workspaceId: string, paperAccountId: string): Promise<void> {
    if (!(await this.accounts.get(workspaceId, paperAccountId))) {
      throw new Error('paper account not found in workspace');
    }
  }
}
