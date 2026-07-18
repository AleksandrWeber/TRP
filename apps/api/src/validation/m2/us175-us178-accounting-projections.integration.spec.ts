import { PrismaClient } from '@prisma/client';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import {
  TransactionalConsumerProgress,
  TransactionalOutboxAppender,
} from '../../modules/event-processing';
import { M2_PAPER_FILL_CONFIGURATION } from '../../modules/execution-adapter';
import { FillQueryService, PrismaFillRepository } from '../../modules/execution-engine';
import { LedgerService, PrismaLedgerRepository } from '../../modules/ledger';
import { PaperAccountService } from '../../modules/paper-account';
import { PrismaPaperAccountRepository } from '../../modules/paper-account/persistence/prisma-paper-account.repository';
import {
  AccountingQueryService,
  AccountingRebuildService,
  AccountingReconciliationService,
  PortfolioProjectionService,
  PositionValuationService,
  PrismaPositionRepository,
} from '../../modules/positions';
import { PrismaPortfolioRepository } from '../../modules/positions/persistence/prisma-portfolio.repository';
import { PrismaPositionValuationRepository } from '../../modules/positions/persistence/prisma-position-valuation.repository';
import { PrismaTransactionService } from '../../storage/prisma/prisma-transaction.service';

const WS = 'ws-us175-us178';
const POSITION = 'position-us175-us178';
const t0 = '2026-07-18T20:00:00.000Z';

describe('US175–US178 — durable accounting projections', () => {
  const prisma = new PrismaClient();
  const transactions = new PrismaTransactionService(prisma);
  const outbox = new TransactionalOutboxAppender();
  const accounts = new PaperAccountService(
    new PrismaPaperAccountRepository(prisma),
    transactions,
    outbox,
  );
  const ledger = new LedgerService(
    new PrismaLedgerRepository(prisma),
    accounts,
    transactions,
    outbox,
  );
  const positions = new PrismaPositionRepository(prisma);
  const valuationRepository = new PrismaPositionValuationRepository(prisma);
  const portfolioRepository = new PrismaPortfolioRepository(prisma);
  const valuations = new PositionValuationService(
    positions,
    valuationRepository,
    M2_PAPER_FILL_CONFIGURATION,
    transactions,
    new TransactionalConsumerProgress(),
    outbox,
  );
  const portfolios = new PortfolioProjectionService(
    ledger,
    valuationRepository,
    portfolioRepository,
    transactions,
    outbox,
  );
  const reconciliations = new AccountingReconciliationService(prisma);
  const fillQueries = new FillQueryService(new PrismaFillRepository(prisma));
  const rebuild = new AccountingRebuildService(
    fillQueries,
    positions,
    valuationRepository,
    portfolioRepository,
    ledger,
    M2_PAPER_FILL_CONFIGURATION,
    reconciliations,
  );
  const queries = new AccountingQueryService(
    fillQueries,
    positions,
    valuationRepository,
    portfolioRepository,
    ledger,
    accounts,
    reconciliations,
  );
  let accountId: string;

  beforeAll(() => prisma.$connect());
  beforeEach(async () => {
    await cleanup();
    const account = await accounts.create({
      workspaceId: WS,
      currency: 'USDT',
      mode: 'paper',
      openingCapital: '1000',
      idempotencyKey: 'account-us175-us178',
      actorId: 'admin',
      openedAt: t0,
      recordedAt: t0,
    });
    accountId = account.id;
    await ledger.openPaperAccount({
      workspaceId: WS,
      paperAccountId: accountId,
      idempotencyKey: 'opening-us175-us178',
      actorId: 'ledger',
      recordedAt: '2026-07-18T20:00:00.100Z',
    });
    await prisma.paperPosition.create({
      data: {
        id: POSITION,
        workspaceId: WS,
        paperAccountId: accountId,
        instrument: 'BTCUSDT',
        side: 'flat',
        quantity: '0',
        averageEntryPrice: '0',
        costBasis: '0',
        realizedPnl: '0',
        version: 1,
        lastAppliedFillId: 'historical-fill',
        lastAppliedFillSequence: 1,
        occurredAt: new Date(t0),
        recordedAt: new Date(t0),
      },
    });
  });
  afterAll(async () => {
    await cleanup();
    await prisma.$disconnect();
  });

  it('US175 applies a mark once and ignores duplicate or out-of-order delivery', async () => {
    const applied = await valuations.applyMark(mark('mark-10', 10));
    const duplicate = await valuations.applyMark(mark('mark-10', 10));
    const stale = await valuations.applyMark(mark('mark-9', 9));

    expect(applied.outcome).toBe('applied');
    expect(applied.valuations[0]?.markPrice).toBe('125.5');
    expect(duplicate.outcome).toBe('duplicate');
    expect(stale.outcome).toBe('stale');
    expect(await prisma.positionValuation.count({ where: { workspaceId: WS } })).toBe(1);
  });

  it('US176 and US178 expose a versioned projection with decimal strings only', async () => {
    await valuations.applyMark(mark('mark-10', 10));
    const portfolio = await portfolios.refresh(WS, accountId, '2026-07-18T20:02:00.000Z');
    const view = await queries.portfolioView(WS, accountId);

    expect(portfolio).toMatchObject({
      cash: '1000',
      marketValue: '0',
      equity: '1000',
      totalPnl: '0',
      complete: true,
      version: 1,
    });
    expect(view).toMatchObject({
      dataClass: 'portfolio_projection',
      projection: true,
      authoritative: false,
    });
    expect(typeof view.portfolio?.equity).toBe('string');
    await expect(queries.portfolioView('other-workspace', accountId)).rejects.toThrow(
      'paper account not found in workspace',
    );
  });

  it('US177 detects deterministic rebuild mismatch and blocks affected execution', async () => {
    await valuations.applyMark(mark('mark-10', 10));
    await portfolios.refresh(WS, accountId, '2026-07-18T20:02:00.000Z');
    const result = await rebuild.reconcile(WS, accountId, '2026-07-18T20:03:00.000Z');

    expect(result.status).toBe('mismatch');
    await expect(reconciliations.assertExecutionEligible(WS, accountId)).rejects.toThrow(
      'execution blocked',
    );
    expect(await prisma.paperPosition.count({ where: { workspaceId: WS } })).toBe(1);
    expect(await prisma.ledgerTransaction.count({ where: { workspaceId: WS } })).toBe(1);
  });

  function mark(eventId: string, sequence: number) {
    return {
      workspaceId: WS,
      instrument: 'BTCUSDT',
      marketStreamId: 'mark-stream-us175',
      marketEventId: eventId,
      marketSequence: sequence,
      markPrice: '125.5',
      occurredAt: `2026-07-18T20:01:${sequence === 10 ? '10' : '09'}.000Z`,
      recordedAt: `2026-07-18T20:01:${sequence === 10 ? '11' : '10'}.000Z`,
    };
  }

  async function cleanup() {
    await prisma.inboxRecord.deleteMany({
      where: { consumerId: 'm2-position-valuation' },
    });
    await prisma.consumerCheckpointRecord.deleteMany({
      where: { consumerId: 'm2-position-valuation' },
    });
    await prisma.outboxEvent.deleteMany({ where: { workspaceId: WS } });
    await prisma.accountingReconciliation.deleteMany({ where: { workspaceId: WS } });
    await prisma.paperPortfolioProjection.deleteMany({ where: { workspaceId: WS } });
    await prisma.positionValuation.deleteMany({ where: { workspaceId: WS } });
    await prisma.paperPosition.deleteMany({ where: { workspaceId: WS } });
    await prisma.ledgerEntry.deleteMany({ where: { workspaceId: WS } });
    await prisma.ledgerTransaction.deleteMany({ where: { workspaceId: WS } });
    await prisma.ledgerCashBalance.deleteMany({ where: { workspaceId: WS } });
    await prisma.paperFill.deleteMany({ where: { workspaceId: WS } });
    await prisma.paperAccount.deleteMany({ where: { workspaceId: WS } });
  }
});
