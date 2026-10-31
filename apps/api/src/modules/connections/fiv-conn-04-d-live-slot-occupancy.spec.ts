/**
 * FIV-CONN-04-D Stage 4 — module-local D-path occupancy helper (OQ-S4-03 Option A).
 */

import { describe, expect, it, vi } from 'vitest';
import { resolveFivConn04DLiveSlotOccupancy } from './fiv-conn-04-d-live-slot-occupancy';
import type { FivConn04LiveConnectionInput } from './fiv-conn-04-live-classifier';

function connection(
  overrides: Partial<FivConn04LiveConnectionInput> = {},
): FivConn04LiveConnectionInput {
  return Object.freeze({
    id: 'conn-1',
    workspaceId: 'ws-a',
    provider: 'binance',
    connectionType: 'EXCHANGE',
    environment: null,
    vaultSecretId: 'vault-1',
    status: 'ACTIVE',
    ...overrides,
  });
}

describe('resolveFivConn04DLiveSlotOccupancy (Stage 4 D-path helper)', () => {
  it('returns verified_vacant when no live occupant exists', async () => {
    const findFirst = vi.fn().mockResolvedValue(null);
    const prisma = { connectionRecord: { findFirst } } as never;
    await expect(resolveFivConn04DLiveSlotOccupancy(prisma, connection())).resolves.toEqual({
      status: 'verified_vacant',
    });
    expect(findFirst).toHaveBeenCalledTimes(1);
    expect(findFirst).toHaveBeenCalledWith({
      where: {
        workspaceId: 'ws-a',
        provider: 'binance',
        environment: 'live',
        connectionType: 'EXCHANGE',
        vaultSecretId: { not: null },
        status: { not: 'REVOKED' },
        id: { not: 'conn-1' },
      },
      select: { id: true },
    });
  });

  it('returns occupied with occupantId when a live peer exists', async () => {
    const findFirst = vi.fn().mockResolvedValue({ id: 'conn-peer' });
    const prisma = { connectionRecord: { findFirst } } as never;
    await expect(resolveFivConn04DLiveSlotOccupancy(prisma, connection())).resolves.toEqual({
      status: 'occupied',
      occupantId: 'conn-peer',
    });
  });

  it('returns unavailable on read failure and never coerces to vacant', async () => {
    const findFirst = vi.fn().mockRejectedValue(new Error('db down'));
    const prisma = { connectionRecord: { findFirst } } as never;
    await expect(resolveFivConn04DLiveSlotOccupancy(prisma, connection())).resolves.toEqual({
      status: 'unavailable',
    });
  });

  it('skips DB query for non-candidate rows (non-EXCHANGE / already populated / revoked / blank vault)', async () => {
    const findFirst = vi.fn();
    const prisma = { connectionRecord: { findFirst } } as never;
    await expect(
      resolveFivConn04DLiveSlotOccupancy(prisma, connection({ connectionType: 'AI' })),
    ).resolves.toEqual({ status: 'verified_vacant' });
    await expect(
      resolveFivConn04DLiveSlotOccupancy(prisma, connection({ environment: 'live' })),
    ).resolves.toEqual({ status: 'verified_vacant' });
    await expect(
      resolveFivConn04DLiveSlotOccupancy(prisma, connection({ vaultSecretId: null })),
    ).resolves.toEqual({ status: 'verified_vacant' });
    await expect(
      resolveFivConn04DLiveSlotOccupancy(prisma, connection({ status: 'REVOKED' })),
    ).resolves.toEqual({ status: 'verified_vacant' });
    expect(findFirst).not.toHaveBeenCalled();
  });
});
