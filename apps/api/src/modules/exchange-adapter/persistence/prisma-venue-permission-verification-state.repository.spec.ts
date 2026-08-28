import { describe, expect, it } from 'vitest';
import { PrismaVenuePermissionVerificationStateRepository } from './prisma-venue-permission-verification-state.repository';
import { buildVenuePermissionVerificationAnchorState } from '../domain/durable-venue-permission-verification-state';

function createPrismaMock() {
  const rows = new Map<string, unknown>();
  const key = (workspaceId: string, exchangeIdentifier: string) =>
    `${workspaceId}:${exchangeIdentifier}`;

  return {
    workspaceVenuePermissionVerificationState: {
      upsert: async ({
        where: {
          workspaceId_exchangeIdentifier: { workspaceId, exchangeIdentifier },
        },
        create,
        update,
      }: {
        where: {
          workspaceId_exchangeIdentifier: { workspaceId: string; exchangeIdentifier: string };
        };
        create: unknown;
        update: unknown;
      }) => {
        const compositeKey = key(workspaceId, exchangeIdentifier);
        const data = rows.has(compositeKey) ? update : create;
        rows.set(compositeKey, data);
        return data;
      },
      findUnique: async ({
        where: {
          workspaceId_exchangeIdentifier: { workspaceId, exchangeIdentifier },
        },
      }: {
        where: {
          workspaceId_exchangeIdentifier: { workspaceId: string; exchangeIdentifier: string };
        };
      }) => rows.get(key(workspaceId, exchangeIdentifier)) ?? null,
      findMany: async () => [...rows.values()],
    },
    _rows: rows,
  };
}

describe('PrismaVenuePermissionVerificationStateRepository — W4-E05-b', () => {
  it('save and load round-trip canonical permission verification anchors', async () => {
    const prisma = createPrismaMock();
    const repository = new PrismaVenuePermissionVerificationStateRepository(prisma as never);

    const outcome = buildVenuePermissionVerificationAnchorState({
      workspaceId: 'ws-a',
      exchangeIdentifier: 'KRAKEN',
      connectionId: 'conn-kraken-1',
      adapterExchangeConnectionId: 'ex-conn-kraken-1',
      permissionVerificationId: 'pv-kraken-1',
      vendorPermissionHash: 'vendor-hash-kraken',
      integrityMetadataHash: 'integrity-hash-kraken',
      correlationId: 'corr-kraken',
      recordedAt: '2026-08-29T10:00:00.000Z',
      prior: null,
    });
    expect(outcome.ok).toBe(true);
    if (!outcome.ok) {
      return;
    }

    await repository.saveVenuePermissionVerificationState(outcome.state);
    const loaded = await repository.loadVenuePermissionVerificationState('ws-a', 'KRAKEN');

    expect(loaded).toMatchObject({
      workspaceId: 'ws-a',
      exchangeIdentifier: 'KRAKEN',
      connectionId: 'conn-kraken-1',
      permissionVerificationId: 'pv-kraken-1',
    });
  });

  it('listAllVenuePermissionVerificationStates returns persisted rows', async () => {
    const prisma = createPrismaMock();
    const repository = new PrismaVenuePermissionVerificationStateRepository(prisma as never);

    const outcome = buildVenuePermissionVerificationAnchorState({
      workspaceId: 'ws-b',
      exchangeIdentifier: 'OKX',
      connectionId: 'conn-okx-1',
      adapterExchangeConnectionId: 'ex-conn-okx-1',
      permissionVerificationId: 'pv-okx-1',
      vendorPermissionHash: 'vendor-hash-okx',
      integrityMetadataHash: 'integrity-hash-okx',
      correlationId: 'corr-okx',
      recordedAt: '2026-08-29T10:05:00.000Z',
      prior: null,
    });
    expect(outcome.ok).toBe(true);
    if (!outcome.ok) {
      return;
    }

    await repository.saveVenuePermissionVerificationState(outcome.state);
    const all = await repository.listAllVenuePermissionVerificationStates();
    expect(all).toHaveLength(1);
    expect(all[0]?.exchangeIdentifier).toBe('OKX');
  });
});
