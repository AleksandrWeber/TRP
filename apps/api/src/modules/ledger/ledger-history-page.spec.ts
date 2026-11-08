import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import type { PrismaClient } from '@prisma/client';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { describe, expect, it, vi } from 'vitest';
import { AccountingQueryController } from '../positions/accounting-query.controller';
import {
  AccountingQueryService,
  type LedgerHistoryRead,
} from '../positions/accounting-query.service';
import {
  LedgerAccount,
  LedgerCauseType,
  LedgerDirection,
  createLedgerTransaction,
  type LedgerTransaction,
} from './domain/ledger-transaction';
import {
  decodeLedgerHistoryCursor,
  encodeLedgerHistoryCursor,
  isAfterLedgerHistoryPosition,
  LedgerHistoryCursorError,
} from './domain/ledger-history-cursor';
import { LedgerService } from './ledger.service';
import type { LedgerAccountPageQuery } from './persistence/ledger.repository';
import { PrismaLedgerRepository } from './persistence/prisma-ledger.repository';
import { Role } from '../identity/role';

const workspaceId = 'ws-1';
const paperAccountId = 'account-1';

function transaction(idempotencyKey: string, occurredAt: string): LedgerTransaction {
  return createLedgerTransaction({
    workspaceId,
    paperAccountId,
    idempotencyKey,
    causeType: LedgerCauseType.RESERVATION,
    causeId: idempotencyKey,
    currency: 'USD',
    occurredAt,
    recordedAt: occurredAt,
    actorId: 'tester',
    entries: [
      { account: LedgerAccount.RESERVED_CASH, direction: LedgerDirection.DEBIT, amount: '1' },
      { account: LedgerAccount.AVAILABLE_CASH, direction: LedgerDirection.CREDIT, amount: '1' },
    ],
  });
}

function byHistory(left: LedgerTransaction, right: LedgerTransaction): number {
  return left.occurredAt.localeCompare(right.occurredAt) || left.id.localeCompare(right.id);
}

function queryService(
  transactions: readonly LedgerTransaction[],
  options?: { accountFound?: boolean; onPage?: (query: LedgerAccountPageQuery) => void },
) {
  const ordered = [...transactions].sort(byHistory);
  const pageCalls: LedgerAccountPageQuery[] = [];
  const fullCalls: string[] = [];
  const ledger = {
    listByAccount: vi.fn(async () => {
      fullCalls.push('full');
      return ordered;
    }),
    listByAccountPage: vi.fn(async (query: LedgerAccountPageQuery) => {
      pageCalls.push(query);
      options?.onPage?.(query);
      const rest = query.after
        ? ordered.filter((row) => isAfterLedgerHistoryPosition(row, query.after!))
        : ordered;
      return {
        transactions: rest.slice(0, query.limit),
        hasMore: rest.length > query.limit,
      };
    }),
  };
  const accounts = {
    get: vi.fn(async () => (options?.accountFound === false ? null : { id: paperAccountId })),
  };
  const service = new AccountingQueryService(
    {} as never,
    {} as never,
    {} as never,
    {} as never,
    ledger as never,
    accounts as never,
    {} as never,
  );
  return { service, ledger, accounts, ordered, pageCalls, fullCalls };
}

describe('TD-041 US178 ledger history cursor', () => {
  const sameTime = '2026-07-18T19:10:00.000Z';
  const later = '2026-07-18T19:11:00.000Z';
  const rows = [
    transaction('same-b', sameTime),
    transaction('same-a', sameTime),
    transaction('later', later),
  ].sort(byHistory);

  it('rejects a non-canonical or empty cursor and a foreign scope', () => {
    const position = { occurredAt: sameTime, id: rows[0]!.id };
    const cursor = encodeLedgerHistoryCursor({ workspaceId, paperAccountId }, position);
    expect(decodeLedgerHistoryCursor(cursor, { workspaceId, paperAccountId })).toEqual(position);
    expect(() =>
      decodeLedgerHistoryCursor('not-base64url-json', { workspaceId, paperAccountId }),
    ).toThrow(LedgerHistoryCursorError);
    const version = Buffer.from(
      JSON.stringify({ v: 2, workspaceId, paperAccountId, occurredAt: sameTime, id: rows[0]!.id }),
    ).toString('base64url');
    expect(() => decodeLedgerHistoryCursor(version, { workspaceId, paperAccountId })).toThrow(
      /cursor is invalid/,
    );
    const otherAccount = encodeLedgerHistoryCursor(
      { workspaceId, paperAccountId: 'account-2' },
      position,
    );
    expect(() => decodeLedgerHistoryCursor(otherAccount, { workspaceId, paperAccountId })).toThrow(
      /does not match/,
    );
  });

  it('keeps the no-query response on the full ordered history without nextCursor', async () => {
    const { service, ledger, fullCalls } = queryService(rows);
    const view = await service.ledgerView(workspaceId, paperAccountId);

    expect(ledger.listByAccountPage).not.toHaveBeenCalled();
    expect(fullCalls).toEqual(['full']);
    expect(view).toEqual({
      dataClass: 'authoritative_ledger',
      projection: false,
      authoritative: true,
      transactions: rows.map((row) => ({
        id: row.id,
        causeType: row.causeType,
        causeId: row.causeId,
        currency: row.currency,
        occurredAt: row.occurredAt,
        recordedAt: row.recordedAt,
        entries: row.entries,
        compensationReason: row.compensationReason,
      })),
    });
    expect(view).not.toHaveProperty('nextCursor');
  });

  it('walks equal timestamps and page boundaries without skips or duplicates', async () => {
    const { service, ordered } = queryService(rows);
    const seen: string[] = [];
    let cursor: string | undefined;
    let pages = 0;
    do {
      const page: LedgerHistoryRead = cursor ? { limit: 1, cursor } : { limit: 1 };
      const view = await service.ledgerView(workspaceId, paperAccountId, page);
      expect(view.transactions.length).toBeLessThanOrEqual(1);
      if (view.transactions.length === 1 && view.nextCursor) {
        const decoded = decodeLedgerHistoryCursor(view.nextCursor, { workspaceId, paperAccountId });
        expect(decoded).toEqual({
          occurredAt: view.transactions[0]!.occurredAt,
          id: view.transactions[0]!.id,
        });
      }
      seen.push(...view.transactions.map((row) => row.id));
      cursor = view.nextCursor;
      pages += 1;
    } while (cursor);

    expect(pages).toBe(ordered.length);
    expect(seen).toEqual(ordered.map((row) => row.id));
    expect(new Set(seen).size).toBe(seen.length);
    const tied = ordered.filter((row) => row.occurredAt === sameTime);
    expect(tied).toHaveLength(2);
    expect(tied[0]!.id < tied[1]!.id).toBe(true);
    expect(seen.indexOf(tied[0]!.id)).toBeLessThan(seen.indexOf(tied[1]!.id));
  });

  it('omits nextCursor on the exhausted page and does not query across a mismatched cursor', async () => {
    const { service, ledger } = queryService(rows);
    const first = await service.ledgerView(workspaceId, paperAccountId, { limit: 50 });
    expect(first.transactions).toHaveLength(3);
    expect(first.nextCursor).toBeUndefined();

    const foreign = encodeLedgerHistoryCursor(
      { workspaceId, paperAccountId: 'account-2' },
      { occurredAt: sameTime, id: rows[0]!.id },
    );
    await expect(
      service.ledgerView(workspaceId, paperAccountId, { limit: 10, cursor: foreign }),
    ).rejects.toThrow(/does not match/);
    expect(ledger.listByAccountPage).toHaveBeenCalledTimes(1);
    expect(ledger.listByAccount).not.toHaveBeenCalled();
  });

  it('returns 400 for a scope mismatch without calling the page query', async () => {
    const { service, ledger } = queryService(rows);
    const controller = new AccountingQueryController(service, { assertMember: vi.fn() } as never);
    const foreign = encodeLedgerHistoryCursor(
      { workspaceId: 'ws-other', paperAccountId },
      { occurredAt: sameTime, id: rows[0]!.id },
    );

    await expect(
      controller.ledger(reader, paperAccountId, workspaceId, { limit: '10', cursor: foreign }),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(ledger.listByAccountPage).not.toHaveBeenCalled();
    expect(ledger.listByAccount).not.toHaveBeenCalled();
  });

  it('returns 404 for a missing account and does not page the ledger', async () => {
    const { service, ledger } = queryService([], { accountFound: false });
    const controller = new AccountingQueryController(service, { assertMember: vi.fn() } as never);

    await expect(
      controller.ledger(reader, paperAccountId, workspaceId, { limit: '10' }),
    ).rejects.toBeInstanceOf(NotFoundException);
    await expect(controller.ledger(reader, paperAccountId, workspaceId)).rejects.toBeInstanceOf(
      NotFoundException,
    );
    expect(ledger.listByAccountPage).not.toHaveBeenCalled();
    expect(ledger.listByAccount).not.toHaveBeenCalled();
  });

  it('asks Prisma for one lookahead row and cursors the last returned row', async () => {
    const findMany = vi
      .fn()
      .mockResolvedValue([
        prismaRow('ldg_a', sameTime),
        prismaRow('ldg_b', sameTime),
        prismaRow('ldg_c', later),
      ]);
    const repository = new PrismaLedgerRepository({
      ledgerTransaction: { findMany },
    } as unknown as PrismaClient);

    const page = await repository.listByAccountPage({
      workspaceId,
      paperAccountId,
      limit: 2,
      after: { occurredAt: '2026-07-18T19:09:00.000Z', id: 'ldg_0' },
    });

    expect(findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          workspaceId,
          paperAccountId,
          OR: [
            { occurredAt: { gt: new Date('2026-07-18T19:09:00.000Z') } },
            {
              occurredAt: new Date('2026-07-18T19:09:00.000Z'),
              id: { gt: 'ldg_0' },
            },
          ],
        },
        orderBy: [{ occurredAt: 'asc' }, { id: 'asc' }],
        take: 3,
      }),
    );
    expect(page.hasMore).toBe(true);
    expect(page.transactions.map((row) => row.id)).toEqual(['ldg_a', 'ldg_b']);
  });

  it('summarizes the full account history and leaves rebuild callers on that path', async () => {
    const listed: LedgerTransaction[][] = [];
    const ledger = {
      listByAccount: vi.fn(async () => {
        listed.push(rows);
        return rows;
      }),
      listByAccountPage: vi.fn(async () => {
        throw new Error('summary must not page');
      }),
    };
    const summary = await new LedgerService(
      ledger as never,
      {} as never,
      {} as never,
      {} as never,
    ).summarizeAccount(workspaceId, paperAccountId);

    expect(summary.version).toBe(rows.length);
    expect(listed).toEqual([rows]);
    expect(ledger.listByAccountPage).not.toHaveBeenCalled();

    const positions = join(process.cwd(), 'src/modules/positions');
    for (const name of ['portfolio-projection.service.ts', 'accounting-rebuild.service.ts']) {
      const source = readFileSync(join(positions, name), 'utf8');
      expect(source).toContain('this.ledger.summarizeAccount');
      expect(source).not.toContain('listByAccountPage');
    }
  });
});

const reader = {
  user: {
    userId: 'user-1',
    email: 'reader@example.com',
    displayName: 'Reader',
    role: Role.Reader,
  },
};

function prismaRow(id: string, occurredAt: string) {
  return {
    id,
    workspaceId,
    exchangeScopeId: 'exchange-scope:binance',
    paperAccountId,
    idempotencyKey: id,
    causeType: LedgerCauseType.RESERVATION,
    causeId: id,
    currency: 'USD',
    occurredAt: new Date(occurredAt),
    recordedAt: new Date(occurredAt),
    actorId: 'tester',
    correlationId: null,
    compensationReason: null,
    entries: [
      {
        id: `${id}:1`,
        transactionId: id,
        workspaceId,
        line: 1,
        account: LedgerAccount.RESERVED_CASH,
        direction: LedgerDirection.DEBIT,
        amount: { toFixed: () => '1' },
      },
      {
        id: `${id}:2`,
        transactionId: id,
        workspaceId,
        line: 2,
        account: LedgerAccount.AVAILABLE_CASH,
        direction: LedgerDirection.CREDIT,
        amount: { toFixed: () => '1' },
      },
    ],
  };
}
