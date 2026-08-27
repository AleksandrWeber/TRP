import { describe, expect, it } from 'vitest';
import type { Prisma } from '@prisma/client';
import { PrismaKillSwitchStateRepository } from './prisma-kill-switch-state.repository';

const recordedAt = new Date('2026-08-27T18:00:00.000Z');

function createPrismaMock() {
  const rows = new Map<string, Prisma.WorkspaceKillSwitchStateUncheckedCreateInput>();
  return {
    workspaceKillSwitchState: {
      upsert: async ({
        where: { workspaceId },
        create,
        update,
      }: {
        where: { workspaceId: string };
        create: Prisma.WorkspaceKillSwitchStateUncheckedCreateInput;
        update: Prisma.WorkspaceKillSwitchStateUncheckedCreateInput;
      }) => {
        const data = rows.has(workspaceId) ? update : create;
        rows.set(workspaceId, data);
        return data;
      },
      findUnique: async ({ where: { workspaceId } }: { where: { workspaceId: string } }) => {
        const row = rows.get(workspaceId);
        if (!row) return null;
        return {
          ...row,
          updatedAt: row.updatedAt ?? recordedAt,
        };
      },
    },
    _rows: rows,
  };
}

describe('PrismaKillSwitchStateRepository — W3-O04-b', () => {
  it('round-trips armed state through upsert and load', async () => {
    const prisma = createPrismaMock();
    const repository = new PrismaKillSwitchStateRepository(prisma as never);

    await repository.saveKillSwitchState(
      Object.freeze({
        workspaceId: 'ws-1',
        armed: true,
        reason: 'halt',
        armedAt: recordedAt.toISOString(),
        armedByActorId: 'actor-1',
        clearedAt: null,
        clearedByActorId: null,
        correlationId: 'corr-1',
        schemaVersion: 1,
        updatedAt: recordedAt.toISOString(),
      }),
    );

    const loaded = await repository.loadKillSwitchState('ws-1');
    expect(loaded).toMatchObject({
      workspaceId: 'ws-1',
      armed: true,
      reason: 'halt',
      armedByActorId: 'actor-1',
      correlationId: 'corr-1',
    });
  });

  it('loadKillSwitchState returns null when row is absent', async () => {
    const prisma = createPrismaMock();
    const repository = new PrismaKillSwitchStateRepository(prisma as never);
    expect(await repository.loadKillSwitchState('ws-missing')).toBeNull();
  });
});
