import { describe, expect, it, vi } from 'vitest';
import { VenuePermissionVerificationPersistenceService } from './venue-permission-verification-persistence.service';
import type { VenuePermissionVerificationStateRepository } from './domain/venue-permission-verification-state.repository';
import type { DurableVenuePermissionVerificationState } from './domain/durable-venue-permission-verification-state';

const recordedAt = '2026-08-29T10:00:00.000Z';

function createRepository(): VenuePermissionVerificationStateRepository & {
  saved: DurableVenuePermissionVerificationState[];
} {
  const saved: DurableVenuePermissionVerificationState[] = [];
  const current = new Map<string, DurableVenuePermissionVerificationState>();

  return {
    saved,
    saveVenuePermissionVerificationState: vi.fn(async (state) => {
      current.set(`${state.workspaceId}:${state.exchangeIdentifier}`, state);
      saved.push(state);
    }),
    loadVenuePermissionVerificationState: vi.fn(
      async (workspaceId, exchangeIdentifier) =>
        current.get(`${workspaceId}:${exchangeIdentifier}`) ?? null,
    ),
    listAllVenuePermissionVerificationStates: vi.fn(async () => saved),
  };
}

function createService(repository: VenuePermissionVerificationStateRepository) {
  return new VenuePermissionVerificationPersistenceService(repository);
}

describe('VenuePermissionVerificationPersistenceService — W4-E05-b storage only', () => {
  it('persistVerificationAnchors writes canonical permission verification anchors', async () => {
    const repository = createRepository();
    const service = createService(repository);

    const outcome = await service.persistVerificationAnchors({
      workspaceId: 'ws-1',
      exchangeIdentifier: 'BINANCE',
      connectionId: 'conn-42',
      adapterExchangeConnectionId: 'ex-conn-9',
      permissionVerificationId: 'pv-99',
      vendorPermissionHash: 'vendor-hash',
      integrityMetadataHash: 'integrity-hash',
      correlationId: 'corr-1',
      recordedAt,
    });

    expect(outcome.ok).toBe(true);
    expect(repository.saved).toHaveLength(1);
    expect(repository.saved[0]).toMatchObject({
      workspaceId: 'ws-1',
      exchangeIdentifier: 'BINANCE',
      connectionId: 'conn-42',
      adapterExchangeConnectionId: 'ex-conn-9',
      permissionVerificationId: 'pv-99',
      vendorPermissionHash: 'vendor-hash',
      integrityMetadataHash: 'integrity-hash',
      correlationId: 'corr-1',
    });
    expect(repository.saved[0]).not.toHaveProperty('apiPermissions');
    expect(await service.loadState('ws-1', 'BINANCE')).toMatchObject({
      permissionVerificationId: 'pv-99',
    });
  });

  it('loadState returns null when workspace has no persisted row', async () => {
    const repository = createRepository();
    const service = createService(repository);
    expect(await service.loadState('ws-missing', 'OKX')).toBeNull();
  });

  it('does not inject recovery store — repository-only load path', async () => {
    const repository = createRepository();
    const service = createService(repository);
    expect(service).not.toHaveProperty('recoveryStore');
  });
});
