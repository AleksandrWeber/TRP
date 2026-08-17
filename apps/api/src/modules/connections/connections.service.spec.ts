import { describe, expect, it } from 'vitest';
import { ConnectionsService } from './connections.service';

const createdAt = new Date('2026-08-17T16:00:00.000Z');
const updatedAt = new Date('2026-08-17T16:01:00.000Z');

describe('ConnectionsService (W2-S01-a)', () => {
  it('creates metadata only with the provider type and disconnected default', async () => {
    const create = async ({ data }: { data: Record<string, unknown> }) => ({
      ...data,
      createdAt,
      updatedAt,
    });
    const service = new ConnectionsService({ connectionRecord: { create } } as never);

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

  it('always scopes a lookup by workspace', async () => {
    let where: unknown;
    const findFirst = async (input: { where: unknown }) => {
      where = input.where;
      return null;
    };
    const service = new ConnectionsService({ connectionRecord: { findFirst } } as never);

    await expect(service.get('workspace-a', 'connection-b')).rejects.toThrow(
      'Connection not found',
    );
    expect(where).toEqual({ id: 'connection-b', workspaceId: 'workspace-a' });
  });
});
