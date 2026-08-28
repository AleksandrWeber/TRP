import { describe, expect, it, vi, beforeEach } from 'vitest';
import { buildVenuePermissionVerificationAnchorState } from './domain/durable-venue-permission-verification-state';
import type { VenuePermissionVerificationStateRepository } from './domain/venue-permission-verification-state.repository';
import type { DurableVenuePermissionVerificationState } from './domain/durable-venue-permission-verification-state';
import {
  getVenuePermissionContinuityRecord,
  resetVenuePermissionContinuity,
} from './domain/venue-permission-continuity-status';
import { VenuePermissionRecoveryStore } from './venue-permission-recovery-store';
import { VenuePermissionRestartRecoveryService } from './venue-permission-restart-recovery.service';
import { VenuePermissionVerificationPersistenceService } from './venue-permission-verification-persistence.service';

const recordedAt = '2026-08-29T10:00:00.000Z';

function verifiedAnchor(workspaceId: string, exchangeIdentifier: string) {
  const outcome = buildVenuePermissionVerificationAnchorState({
    workspaceId,
    exchangeIdentifier,
    connectionId: 'conn-42',
    adapterExchangeConnectionId: 'ex-conn-9',
    permissionVerificationId: 'pv-99',
    vendorPermissionHash: 'vendor-hash',
    integrityMetadataHash: 'integrity-hash',
    correlationId: 'corr-1',
    recordedAt,
    prior: null,
  });
  if (!outcome.ok) throw new Error('expected verified anchor');
  return outcome.state;
}

function createRepository(
  initial: DurableVenuePermissionVerificationState[] = [],
): VenuePermissionVerificationStateRepository & {
  saved: DurableVenuePermissionVerificationState[];
} {
  const saved = [...initial];
  const current = new Map(
    initial.map((s) => [`${s.workspaceId}:${s.exchangeIdentifier}`, s] as const),
  );
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

describe('VenuePermissionRestartRecoveryService — W4-E05-c', () => {
  beforeEach(() => {
    resetVenuePermissionContinuity();
  });

  it('hydrate restores persisted state into recovery store', async () => {
    const state = verifiedAnchor('ws-1', 'BINANCE');
    const repository = createRepository([state]);
    const recoveryStore = new VenuePermissionRecoveryStore();
    const service = new VenuePermissionRestartRecoveryService(repository, recoveryStore);

    const diagnostics = await service.hydrate();
    expect(diagnostics.restoredCount).toBe(1);
    expect(diagnostics.verifiedAnchorCount).toBe(1);
    expect(service.getRecoveredState('ws-1', 'BINANCE')?.permissionVerificationId).toBe('pv-99');
  });

  it('missing persisted state yields empty recovery without fabrication', async () => {
    const service = new VenuePermissionRestartRecoveryService(
      createRepository([]),
      new VenuePermissionRecoveryStore(),
    );
    const diagnostics = await service.hydrate();
    expect(diagnostics.restoredCount).toBe(0);
    expect(service.getRecoveredState('ws-missing', 'OKX')).toBeNull();
  });

  it('hydrate is idempotent', async () => {
    const state = verifiedAnchor('ws-a', 'BYBIT');
    const service = new VenuePermissionRestartRecoveryService(
      createRepository([state]),
      new VenuePermissionRecoveryStore(),
    );
    const first = await service.hydrate();
    const second = await service.hydrate();
    expect(first).toEqual(second);
  });

  it('hydrate records continuity success for W4-E05-d projection', async () => {
    const state = verifiedAnchor('ws-1', 'KRAKEN');
    const service = new VenuePermissionRestartRecoveryService(
      createRepository([state]),
      new VenuePermissionRecoveryStore(),
    );
    await service.hydrate();
    const continuity = getVenuePermissionContinuityRecord();
    expect(continuity?.integrityVerified).toBe(true);
    expect(continuity?.diagnostics?.restoredCount).toBe(1);
  });
});

describe('VenuePermissionVerificationPersistenceService — W4-E05-c hydrated reads', () => {
  it('loadState reads from recovery store after hydrate', async () => {
    const state = verifiedAnchor('ws-1', 'BINANCE');
    const repository = createRepository([state]);
    const recoveryStore = new VenuePermissionRecoveryStore();
    const recoveryService = new VenuePermissionRestartRecoveryService(repository, recoveryStore);
    await recoveryService.hydrate();

    const persistence = new VenuePermissionVerificationPersistenceService(
      repository,
      recoveryStore,
    );
    expect(await persistence.loadState('ws-1', 'BINANCE')).toMatchObject({
      permissionVerificationId: 'pv-99',
    });
  });

  it('persistVerificationAnchors write-through updates recovery store', async () => {
    const repository = createRepository([]);
    const recoveryStore = new VenuePermissionRecoveryStore();
    const persistence = new VenuePermissionVerificationPersistenceService(
      repository,
      recoveryStore,
    );

    await persistence.persistVerificationAnchors({
      workspaceId: 'ws-1',
      exchangeIdentifier: 'OKX',
      connectionId: 'conn-99',
      adapterExchangeConnectionId: 'ex-conn-99',
      permissionVerificationId: 'pv-new',
      vendorPermissionHash: 'vendor-hash-new',
      integrityMetadataHash: 'integrity-hash-new',
      correlationId: 'corr-new',
      recordedAt,
    });

    expect(recoveryStore.get('ws-1', 'OKX')?.permissionVerificationId).toBe('pv-new');
    expect(await persistence.loadState('ws-1', 'OKX')).toMatchObject({
      permissionVerificationId: 'pv-new',
    });
  });
});
