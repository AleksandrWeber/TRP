import type { Prisma, PrismaClient } from '@prisma/client';
import {
  prismaClientForTransaction,
  type TransactionContext,
} from '../../../../storage/prisma/prisma-transaction.service';
import {
  parseWorkspaceLivePolicy,
  WORKSPACE_LIVE_POLICY_STATE_SCHEMA_VERSION,
  type DurableWorkspaceLivePolicyState,
} from '../durable-workspace-live-policy-state';
import type { WorkspaceLivePolicyStateRepository } from '../workspace-live-policy-state.repository';

type LivePolicyStateRow = Prisma.WorkspaceLivePolicyStateGetPayload<Record<string, never>>;

export class PrismaWorkspaceLivePolicyStateRepository implements WorkspaceLivePolicyStateRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async saveLivePolicyState(
    state: DurableWorkspaceLivePolicyState,
    transaction?: TransactionContext,
  ): Promise<void> {
    const client = transaction ? prismaClientForTransaction(transaction) : this.prisma;
    const data = toRow(state);
    await client.workspaceLivePolicyState.upsert({
      where: { workspaceId: state.workspaceId },
      create: data,
      update: data,
    });
  }

  async loadLivePolicyState(workspaceId: string): Promise<DurableWorkspaceLivePolicyState | null> {
    const row = await this.prisma.workspaceLivePolicyState.findUnique({
      where: { workspaceId },
    });
    return row ? toDomain(row) : null;
  }

  async listAllLivePolicyStates(): Promise<readonly DurableWorkspaceLivePolicyState[]> {
    const rows = await this.prisma.workspaceLivePolicyState.findMany({
      orderBy: { workspaceId: 'asc' },
    });
    return Object.freeze(rows.map(toDomain));
  }
}

function toRow(
  state: DurableWorkspaceLivePolicyState,
): Prisma.WorkspaceLivePolicyStateUncheckedCreateInput {
  return {
    workspaceId: state.workspaceId,
    policy: state.policy,
    schemaVersion: state.schemaVersion,
    updatedAt: new Date(state.updatedAt),
  };
}

function toDomain(row: LivePolicyStateRow): DurableWorkspaceLivePolicyState {
  if (row.schemaVersion !== WORKSPACE_LIVE_POLICY_STATE_SCHEMA_VERSION) {
    throw new Error(`Unsupported workspace live policy schema version: ${row.schemaVersion}`);
  }

  // parseWorkspaceLivePolicy throws on invalid / unknown tokens (PO-S02-05).
  const policy = parseWorkspaceLivePolicy(row.policy);

  return Object.freeze({
    workspaceId: row.workspaceId,
    policy,
    schemaVersion: row.schemaVersion,
    updatedAt: row.updatedAt.toISOString(),
  });
}
