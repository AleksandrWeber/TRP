import { describe, expect, it } from 'vitest';
import { ConnectionsService } from './connections.service';

type ConnectionRow = {
  id: string;
  workspaceId: string;
  displayName: string;
  provider: string;
  connectionType: string;
  status: string;
  createdAt: Date;
  updatedAt: Date;
};

function memoryPrisma() {
  const rows: ConnectionRow[] = [];
  return {
    connectionRecord: {
      create: async ({ data }: { data: Omit<ConnectionRow, 'updatedAt'> }) => {
        const row = { ...data, updatedAt: data.createdAt };
        rows.push(row);
        return row;
      },
      findMany: async ({
        where,
        orderBy,
      }: {
        where: { workspaceId: string };
        orderBy: { createdAt: 'asc' };
      }) =>
        rows
          .filter((row) => row.workspaceId === where.workspaceId)
          .sort((a, b) =>
            orderBy.createdAt === 'asc'
              ? a.createdAt.getTime() - b.createdAt.getTime()
              : b.createdAt.getTime() - a.createdAt.getTime(),
          ),
      findFirst: async ({ where }: { where: { id: string; workspaceId: string } }) =>
        rows.find((row) => row.id === where.id && row.workspaceId === where.workspaceId) ?? null,
      update: async ({ where, data }: { where: { id: string }; data: { displayName: string } }) => {
        const row = rows.find((candidate) => candidate.id === where.id);
        if (!row) throw new Error('missing');
        row.displayName = data.displayName;
        row.updatedAt = new Date('2026-08-17T16:05:00.000Z');
        return row;
      },
    },
  };
}

describe('ConnectionsService (W2-S01-a)', () => {
  it('creates metadata only with the provider type and disconnected default', async () => {
    const service = new ConnectionsService(memoryPrisma() as never);
    const connection = await service.create({
      workspaceId: 'workspace-a',
      displayName: ' Primary Binance ',
      provider: 'BINANCE',
    });

    expect(connection).toMatchObject({
      workspaceId: 'workspace-a',
      displayName: 'Primary Binance',
      provider: 'BINANCE',
      connectionType: 'EXCHANGE',
      status: 'DISCONNECTED',
    });
    expect(JSON.stringify(connection)).not.toMatch(/apiKey|password|token|secret|ciphertext/i);
  });

  it('keeps CRUD metadata inside the owning workspace', async () => {
    const service = new ConnectionsService(memoryPrisma() as never);
    const created = await service.create({
      workspaceId: 'workspace-a',
      displayName: 'Telegram alerts',
      provider: 'TELEGRAM',
    });

    await expect(service.list('workspace-b')).resolves.toEqual([]);
    await expect(service.get('workspace-b', created.id)).rejects.toThrow('Connection not found');
    await expect(service.rename('workspace-b', created.id, 'Foreign')).rejects.toThrow(
      'Connection not found',
    );

    const renamed = await service.rename('workspace-a', created.id, 'Workspace A Telegram');
    expect(renamed.displayName).toBe('Workspace A Telegram');
    expect(renamed.status).toBe('DISCONNECTED');
    expect(await service.list('workspace-a')).toHaveLength(1);
  });
});
