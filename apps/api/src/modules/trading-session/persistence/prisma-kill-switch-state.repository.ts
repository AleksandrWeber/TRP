import type { Prisma, PrismaClient } from '@prisma/client';
import {
  prismaClientForTransaction,
  type TransactionContext,
} from '../../../storage/prisma/prisma-transaction.service';
import {
  KILL_SWITCH_STATE_SCHEMA_VERSION,
  type DurableKillSwitchState,
} from '../domain/durable-kill-switch-state';
import { assertRecoverableKillSwitchState } from '../domain/kill-switch-restart-recovery';
import type { KillSwitchStateRepository } from '../domain/kill-switch-state.repository';

type KillSwitchStateRow = Prisma.WorkspaceKillSwitchStateGetPayload<Record<string, never>>;

export class PrismaKillSwitchStateRepository implements KillSwitchStateRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async saveKillSwitchState(
    state: DurableKillSwitchState,
    transaction?: TransactionContext,
  ): Promise<void> {
    const client = transaction ? prismaClientForTransaction(transaction) : this.prisma;
    const data = toRow(state);
    await client.workspaceKillSwitchState.upsert({
      where: { workspaceId: state.workspaceId },
      create: data,
      update: data,
    });
  }

  async loadKillSwitchState(workspaceId: string): Promise<DurableKillSwitchState | null> {
    const row = await this.prisma.workspaceKillSwitchState.findUnique({
      where: { workspaceId },
    });
    return row ? toDomain(row) : null;
  }

  async listAllKillSwitchStates(): Promise<readonly DurableKillSwitchState[]> {
    const rows = await this.prisma.workspaceKillSwitchState.findMany({
      orderBy: { workspaceId: 'asc' },
    });
    return Object.freeze(
      rows.map((row, index) => assertRecoverableKillSwitchState(toDomain(row), index)),
    );
  }
}

function toRow(state: DurableKillSwitchState): Prisma.WorkspaceKillSwitchStateUncheckedCreateInput {
  return {
    workspaceId: state.workspaceId,
    armed: state.armed,
    reason: state.reason,
    armedAt: state.armedAt !== null ? new Date(state.armedAt) : null,
    armedByActorId: state.armedByActorId,
    clearedAt: state.clearedAt !== null ? new Date(state.clearedAt) : null,
    clearedByActorId: state.clearedByActorId,
    correlationId: state.correlationId,
    schemaVersion: state.schemaVersion,
    updatedAt: new Date(state.updatedAt),
  };
}

function toDomain(row: KillSwitchStateRow): DurableKillSwitchState {
  if (row.schemaVersion !== KILL_SWITCH_STATE_SCHEMA_VERSION) {
    throw new Error(`Unsupported kill switch schema version: ${row.schemaVersion}`);
  }

  return Object.freeze({
    workspaceId: row.workspaceId,
    armed: row.armed,
    reason: row.reason,
    armedAt: row.armedAt?.toISOString() ?? null,
    armedByActorId: row.armedByActorId,
    clearedAt: row.clearedAt?.toISOString() ?? null,
    clearedByActorId: row.clearedByActorId,
    correlationId: row.correlationId,
    schemaVersion: row.schemaVersion,
    updatedAt: row.updatedAt.toISOString(),
  });
}
