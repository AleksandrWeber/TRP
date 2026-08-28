import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { beforeEach, describe, expect, it } from 'vitest';
import { buildConnectionManagementAnchorState } from '../modules/exchange-adapter/domain/durable-exchange-connectivity-state';
import { resetExchangeConnectivityContinuity } from '../modules/exchange-adapter/domain/exchange-connectivity-continuity-status';
import {
  ExchangeConnectivityRestartRecoveryError,
  prepareExchangeConnectivityStatesForRecovery,
} from '../modules/exchange-adapter/domain/exchange-connectivity-restart-recovery';
import { ExchangeConnectivityRecoveryStore } from '../modules/exchange-adapter/exchange-connectivity-recovery-store';
import { ExchangeConnectivityRestartRecoveryService } from '../modules/exchange-adapter/exchange-connectivity-restart-recovery.service';
import { PrismaExchangeConnectivityStateRepository } from '../modules/exchange-adapter/persistence/prisma-exchange-connectivity-state.repository';
import {
  W4_E01_C_ARCHITECTURE_CLAIMS,
  W4_E01_C_EXCHANGE_CONNECTIVITY_OWNER,
  W4_E01_C_EXPLICIT_OUT,
  W4_E01_C_RECOVERED_ARTIFACT_IDS,
  W4_E01_C_SLICE_ID,
  W4_E01_C_TECHNICAL_DEBT_DELTA,
  W4_E01_C_TRANSITION_MATRIX,
} from './w4-e01-c-restart-recovery';

const REPO_ROOT = join(__dirname, '../../../..');
const recordedAt = '2026-08-28T12:00:00.000Z';

function connectionAnchor(workspaceId: string) {
  const outcome = buildConnectionManagementAnchorState({
    workspaceId,
    provider: 'BINANCE',
    connectionId: 'conn-42',
    actorId: 'actor-1',
    recordedAt,
    prior: null,
  });
  if (!outcome.ok) throw new Error('expected connection anchor');
  return outcome.state;
}

function createPrismaMock(rows: Record<string, unknown>[]) {
  const store = new Map(rows.map((row) => [row.workspaceId as string, row]));
  return {
    workspaceExchangeConnectivityState: {
      findMany: async () =>
        [...store.values()].sort((a, b) =>
          String(a.workspaceId).localeCompare(String(b.workspaceId)),
        ),
      findUnique: async ({ where: { workspaceId } }: { where: { workspaceId: string } }) =>
        store.get(workspaceId) ?? null,
      upsert: async () => ({}),
    },
  };
}

function toRow(state: ReturnType<typeof connectionAnchor>) {
  return {
    workspaceId: state.workspaceId,
    schemaVersion: state.schemaVersion,
    provider: state.provider,
    connectionAnchorConnectionId: state.connectionAnchorConnectionId,
    connectionAnchorRecordedAt: state.connectionAnchorRecordedAt
      ? new Date(state.connectionAnchorRecordedAt)
      : null,
    connectionAnchorRecordedByActorId: state.connectionAnchorRecordedByActorId,
    adapterAnchorExchangeConnectionId: state.adapterAnchorExchangeConnectionId,
    adapterAnchorRecordedAt: state.adapterAnchorRecordedAt
      ? new Date(state.adapterAnchorRecordedAt)
      : null,
    adapterAnchorRecordedByActorId: state.adapterAnchorRecordedByActorId,
    correlationId: state.correlationId,
    updatedAt: new Date(state.updatedAt),
  };
}

describe('W4-E01-c exchange connectivity restart recovery — unit', () => {
  it('ownership remains exchange-adapter only', () => {
    expect(W4_E01_C_EXCHANGE_CONNECTIVITY_OWNER).toBe('exchange-adapter');
  });

  it('corrupt connection anchor fails honestly', () => {
    const bad = Object.freeze({
      ...connectionAnchor('ws-1'),
      connectionAnchorRecordedAt: null,
    });
    expect(() => prepareExchangeConnectivityStatesForRecovery([bad])).toThrow(
      ExchangeConnectivityRestartRecoveryError,
    );
  });

  it('missing persisted state recovers empty without fabrication', async () => {
    const repository = new PrismaExchangeConnectivityStateRepository(createPrismaMock([]) as never);
    const service = new ExchangeConnectivityRestartRecoveryService(
      repository,
      new ExchangeConnectivityRecoveryStore(),
    );
    const diagnostics = await service.hydrate();
    expect(diagnostics.restoredCount).toBe(0);
    expect(service.getRecoveredState('ws-1')).toBeNull();
  });
});

describe('W4-E01-c exchange connectivity restart recovery — integration', () => {
  beforeEach(() => {
    resetExchangeConnectivityContinuity();
  });

  it('recover persisted exchange connectivity state after normal restart', async () => {
    const state = connectionAnchor('ws-1');
    const repository = new PrismaExchangeConnectivityStateRepository(
      createPrismaMock([toRow(state)]) as never,
    );
    const recoveryStore = new ExchangeConnectivityRecoveryStore();
    const service = new ExchangeConnectivityRestartRecoveryService(repository, recoveryStore);

    const diagnostics = await service.hydrate();
    expect(diagnostics.connectionAnchorCount).toBe(1);
    expect(service.getRecoveredState('ws-1')?.connectionAnchorConnectionId).toBe('conn-42');
    expect(W4_E01_C_ARCHITECTURE_CLAIMS.normalProcessRestartRecovery).toBe(true);
    expect(W4_E01_C_ARCHITECTURE_CLAIMS.exchangeConnectivityStateRestoredAfterRestart).toBe(true);
  });

  it('recovery idempotency: hydrate twice yields same diagnostics', async () => {
    const state = connectionAnchor('ws-a');
    const service = new ExchangeConnectivityRestartRecoveryService(
      new PrismaExchangeConnectivityStateRepository(createPrismaMock([toRow(state)]) as never),
      new ExchangeConnectivityRecoveryStore(),
    );
    const first = await service.hydrate();
    const second = await service.hydrate();
    expect(first).toEqual(second);
    expect(W4_E01_C_ARCHITECTURE_CLAIMS.recoveryIdempotent).toBe(true);
  });

  it('transition matrix documents persistence → recovery → still missing', () => {
    expect(W4_E01_C_TRANSITION_MATRIX.before).toContain('Durable persistence (W4-E01-b)');
    expect(W4_E01_C_TRANSITION_MATRIX.after).toContain('Restart recovery (W4-E01-c)');
    expect(W4_E01_C_TRANSITION_MATRIX.stillMissing).toContain('Operational Continuity (W4-E01-d)');
  });

  it('technical debt delta resolves W4-E01 restart recovery foundation', () => {
    expect(W4_E01_C_TECHNICAL_DEBT_DELTA.resolved[0]).toMatch(/restart recovery/i);
    expect(W4_E01_C_TECHNICAL_DEBT_DELTA.introduced).toEqual([]);
  });

  it('explicit OUT covers operational continuity and W4-E01-d', () => {
    expect(W4_E01_C_EXPLICIT_OUT).toEqual(
      expect.arrayContaining(['operational-continuity', 'w4-e01-d', 'rest-connectivity']),
    );
  });

  it('architecture claims deny operational continuity and exchange connectivity complete', () => {
    expect(W4_E01_C_SLICE_ID).toBe('W4-E01-c');
    expect(W4_E01_C_ARCHITECTURE_CLAIMS.operationalContinuity).toBe(false);
    expect(W4_E01_C_ARCHITECTURE_CLAIMS.exchangeConnectivityCompleteClaimed).toBe(false);
    expect(W4_E01_C_ARCHITECTURE_CLAIMS.newPersistenceOwner).toBe(false);
    expect(W4_E01_C_RECOVERED_ARTIFACT_IDS.length).toBe(1);
  });

  it('required reports exist for W4-E01-c', () => {
    const wave4 = join(REPO_ROOT, 'docs/project/version-3/wave-4');
    for (const name of [
      'w4-e01-c-implementation-report.md',
      'w4-e01-c-architecture-review.md',
      'w4-e01-c-security-review.md',
      'w4-e01-c-product-review.md',
      'w4-e01-c-validation-report.md',
    ]) {
      expect(existsSync(join(wave4, name))).toBe(true);
    }
  });
});
