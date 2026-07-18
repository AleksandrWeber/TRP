import { Inject, Injectable } from '@nestjs/common';
import type { PrismaClient } from '@prisma/client';
import { createHash } from 'node:crypto';
import { PrismaService } from '../../../storage/prisma/prisma.module';

export type AccountingReconciliation = Readonly<{
  id: string;
  workspaceId: string;
  paperAccountId: string;
  status: 'consistent' | 'mismatch';
  sourceHash: string;
  rebuiltHash: string;
  reason: string | null;
  version: number;
  checkedAt: string;
  lastConsistentAt: string | null;
}>;

@Injectable()
export class AccountingReconciliationService {
  constructor(@Inject(PrismaService) private readonly prisma: PrismaClient) {}

  async record(
    workspaceId: string,
    paperAccountId: string,
    sourceHash: string,
    rebuiltHash: string,
    reason: string | null,
    checkedAt: string,
  ): Promise<AccountingReconciliation> {
    const status = sourceHash === rebuiltHash && reason === null ? 'consistent' : 'mismatch';
    const row = await this.prisma.accountingReconciliation.upsert({
      where: { workspaceId_paperAccountId: { workspaceId, paperAccountId } },
      create: {
        id: reconciliationId(workspaceId, paperAccountId),
        workspaceId,
        paperAccountId,
        status,
        sourceHash,
        rebuiltHash,
        reason,
        version: 1,
        checkedAt: new Date(checkedAt),
        lastConsistentAt: status === 'consistent' ? new Date(checkedAt) : null,
      },
      update: {
        status,
        sourceHash,
        rebuiltHash,
        reason,
        version: { increment: 1 },
        checkedAt: new Date(checkedAt),
        ...(status === 'consistent' ? { lastConsistentAt: new Date(checkedAt) } : {}),
      },
    });
    return toDomain(row);
  }

  async get(workspaceId: string, paperAccountId: string): Promise<AccountingReconciliation | null> {
    const row = await this.prisma.accountingReconciliation.findUnique({
      where: { workspaceId_paperAccountId: { workspaceId, paperAccountId } },
    });
    return row ? toDomain(row) : null;
  }

  async assertExecutionEligible(workspaceId: string, paperAccountId: string): Promise<void> {
    const checkpoint = await this.get(workspaceId, paperAccountId);
    if (checkpoint?.status === 'mismatch') {
      throw new Error('execution blocked by accounting reconciliation mismatch');
    }
  }
}

function reconciliationId(workspaceId: string, paperAccountId: string): string {
  return `recon_${createHash('sha256')
    .update(`${workspaceId}:${paperAccountId}`)
    .digest('hex')
    .slice(0, 24)}`;
}

function toDomain(row: {
  id: string;
  workspaceId: string;
  paperAccountId: string;
  status: string;
  sourceHash: string;
  rebuiltHash: string;
  reason: string | null;
  version: number;
  checkedAt: Date;
  lastConsistentAt: Date | null;
}): AccountingReconciliation {
  if (row.status !== 'consistent' && row.status !== 'mismatch') {
    throw new Error(`unsupported accounting reconciliation status: ${row.status}`);
  }
  return Object.freeze({
    ...row,
    status: row.status,
    checkedAt: row.checkedAt.toISOString(),
    lastConsistentAt: row.lastConsistentAt?.toISOString() ?? null,
  });
}
