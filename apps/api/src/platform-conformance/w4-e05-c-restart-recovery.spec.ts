import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { buildVenuePermissionVerificationAnchorState } from '../modules/exchange-adapter/domain/durable-venue-permission-verification-state';
import {
  VenuePermissionRestartRecoveryError,
  prepareVenuePermissionVerificationStatesForRecovery,
} from '../modules/exchange-adapter/domain/venue-permission-restart-recovery';
import { VenuePermissionRecoveryStore } from '../modules/exchange-adapter/venue-permission-recovery-store';
import { VenuePermissionRestartRecoveryService } from '../modules/exchange-adapter/venue-permission-restart-recovery.service';
import { PrismaVenuePermissionVerificationStateRepository } from '../modules/exchange-adapter/persistence/prisma-venue-permission-verification-state.repository';
import {
  W4_E05_C_ARCHITECTURE_CLAIMS,
  W4_E05_C_EXPLICIT_OUT,
  W4_E05_C_RECOVERED_ARTIFACT_IDS,
  W4_E05_C_SLICE_ID,
  W4_E05_C_TECHNICAL_DEBT_DELTA,
  W4_E05_C_TRANSITION_MATRIX,
  W4_E05_C_VENUE_PERMISSION_OWNER,
} from './w4-e05-c-restart-recovery';

const REPO_ROOT = join(__dirname, '../../../..');
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

function createPrismaMock(rows: Record<string, unknown>[]) {
  const store = new Map(
    rows.map((row) => [`${row.workspaceId as string}:${row.exchangeIdentifier as string}`, row]),
  );
  return {
    workspaceVenuePermissionVerificationState: {
      findMany: async () =>
        [...store.values()].sort((a, b) => {
          const byWorkspace = String(a.workspaceId).localeCompare(String(b.workspaceId));
          if (byWorkspace !== 0) return byWorkspace;
          return String(a.exchangeIdentifier).localeCompare(String(b.exchangeIdentifier));
        }),
      findUnique: async ({
        where: {
          workspaceId_exchangeIdentifier: { workspaceId, exchangeIdentifier },
        },
      }: {
        where: {
          workspaceId_exchangeIdentifier: { workspaceId: string; exchangeIdentifier: string };
        };
      }) => store.get(`${workspaceId}:${exchangeIdentifier}`) ?? null,
      upsert: async () => ({}),
    },
  };
}

function toRow(state: ReturnType<typeof verifiedAnchor>) {
  return {
    workspaceId: state.workspaceId,
    exchangeIdentifier: state.exchangeIdentifier,
    schemaVersion: state.schemaVersion,
    connectionId: state.connectionId,
    adapterExchangeConnectionId: state.adapterExchangeConnectionId,
    permissionVerificationId: state.permissionVerificationId,
    vendorPermissionHash: state.vendorPermissionHash,
    integrityMetadataHash: state.integrityMetadataHash,
    correlationId: state.correlationId,
    updatedAt: new Date(state.updatedAt),
  };
}

describe('W4-E05-c venue permission restart recovery — unit', () => {
  it('ownership remains exchange-adapter only', () => {
    expect(W4_E05_C_VENUE_PERMISSION_OWNER).toBe('exchange-adapter');
  });

  it('corrupt verification anchor fails honestly', () => {
    const bad = Object.freeze({
      ...verifiedAnchor('ws-1', 'BINANCE'),
      vendorPermissionHash: null,
    });
    expect(() => prepareVenuePermissionVerificationStatesForRecovery([bad])).toThrow(
      VenuePermissionRestartRecoveryError,
    );
  });

  it('missing persisted state recovers empty without fabrication', async () => {
    const repository = new PrismaVenuePermissionVerificationStateRepository(
      createPrismaMock([]) as never,
    );
    const service = new VenuePermissionRestartRecoveryService(
      repository,
      new VenuePermissionRecoveryStore(),
    );
    const diagnostics = await service.hydrate();
    expect(diagnostics.restoredCount).toBe(0);
    expect(service.getRecoveredState('ws-1', 'BINANCE')).toBeNull();
  });
});

describe('W4-E05-c venue permission restart recovery — integration', () => {
  it('recover persisted venue permission verification state after normal restart', async () => {
    const state = verifiedAnchor('ws-1', 'BINANCE');
    const repository = new PrismaVenuePermissionVerificationStateRepository(
      createPrismaMock([toRow(state)]) as never,
    );
    const recoveryStore = new VenuePermissionRecoveryStore();
    const service = new VenuePermissionRestartRecoveryService(repository, recoveryStore);

    const diagnostics = await service.hydrate();
    expect(diagnostics.verifiedAnchorCount).toBe(1);
    expect(service.getRecoveredState('ws-1', 'BINANCE')?.permissionVerificationId).toBe('pv-99');
    expect(W4_E05_C_ARCHITECTURE_CLAIMS.normalProcessRestartRecovery).toBe(true);
    expect(W4_E05_C_ARCHITECTURE_CLAIMS.venuePermissionVerificationStateRestoredAfterRestart).toBe(
      true,
    );
  });

  it('recovery idempotency: hydrate twice yields same diagnostics', async () => {
    const state = verifiedAnchor('ws-1', 'OKX');
    const service = new VenuePermissionRestartRecoveryService(
      new PrismaVenuePermissionVerificationStateRepository(
        createPrismaMock([toRow(state)]) as never,
      ),
      new VenuePermissionRecoveryStore(),
    );
    const first = await service.hydrate();
    const second = await service.hydrate();
    expect(first).toEqual(second);
  });

  it('architecture claims: no operational continuity or customer-visible feature', () => {
    expect(W4_E05_C_ARCHITECTURE_CLAIMS.operationalContinuity).toBe(false);
    expect(W4_E05_C_ARCHITECTURE_CLAIMS.customerVisibleFeature).toBe(false);
    expect(W4_E05_C_ARCHITECTURE_CLAIMS.recoveryCanFabricateMissingState).toBe(false);
    expect(W4_E05_C_ARCHITECTURE_CLAIMS.recoveryCanRecoverCorruptedState).toBe(false);
    expect(W4_E05_C_ARCHITECTURE_CLAIMS.newPersistenceOwner).toBe(false);
  });

  it('recovered artifact ids reference W4-E05-b persistence foundation', () => {
    expect(W4_E05_C_RECOVERED_ARTIFACT_IDS).toEqual(['persist-vendor-permission-verification']);
  });

  it('transition matrix: persistence + recovery; operational continuity still missing', () => {
    expect(W4_E05_C_TRANSITION_MATRIX.before).toContain('Durable persistence (W4-E05-b)');
    expect(W4_E05_C_TRANSITION_MATRIX.after).toContain('Restart recovery (W4-E05-c)');
    expect(
      W4_E05_C_TRANSITION_MATRIX.stillMissing.some((item) => item.includes('Operational')),
    ).toBe(true);
  });

  it('technical debt delta: restart recovery resolved; continuity deferred', () => {
    expect(W4_E05_C_TECHNICAL_DEBT_DELTA.resolved.length).toBeGreaterThan(0);
    expect(W4_E05_C_TECHNICAL_DEBT_DELTA.introduced).toEqual([]);
    expect(W4_E05_C_TECHNICAL_DEBT_DELTA.deferred.some((item) => item.includes('continuity'))).toBe(
      true,
    );
  });

  it('explicit OUT covers operational continuity and W4-E05-d', () => {
    expect(W4_E05_C_EXPLICIT_OUT).toEqual(
      expect.arrayContaining(['operational-continuity', 'w4-e05-d']),
    );
  });

  it('required reports and recovery files exist', () => {
    const wave4 = join(REPO_ROOT, 'docs/project/version-3/wave-4');
    for (const name of [
      'w4-e05-c-implementation-report.md',
      'w4-e05-c-architecture-review.md',
      'w4-e05-c-security-review.md',
      'w4-e05-c-product-review.md',
      'w4-e05-c-validation-report.md',
    ]) {
      expect(existsSync(join(wave4, name))).toBe(true);
    }
    expect(
      existsSync(
        join(
          REPO_ROOT,
          'apps/api/src/modules/exchange-adapter/venue-permission-restart-recovery.service.ts',
        ),
      ),
    ).toBe(true);
  });

  it('slice id is W4-E05-c', () => {
    expect(W4_E05_C_SLICE_ID).toBe('W4-E05-c');
  });
});
