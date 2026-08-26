import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  assertOperationalState,
  buildPlatformOperationalProjection,
  derivePlatformOperationalState,
  evaluateOwnerOperationalStates,
  healthyOwnersContinueWhileOthersUnavailable,
  OPERATIONAL_STATES,
} from '../modules/operational-continuity/operational-readiness';
import { OperationalContinuityService } from '../modules/operational-continuity/operational-continuity.service';
import { OperationalContinuityAudit } from '../modules/operational-continuity/operational-continuity-audit';
import {
  getAnalyticalOwnerBootOutcome,
  recordAnalyticalOwnerBootOutcome,
  resetAnalyticalOwnerBootOutcomes,
} from '../persistence/analytical-owner-continuity-status';
import { createRepositoryByDriver } from '../persistence/create-repository-by-driver';
import {
  continuityOwnersMatchDurableSet,
  transitionSafetyAnswers,
  W3_O01_D_ARCHITECTURE_CLAIMS,
  W3_O01_D_SLICE_ID,
  W3_O01_D_SUPPORTED_STATES,
} from './w3-o01-d-operational-continuity';

const REPO_ROOT = join(__dirname, '../../../..');

describe('W3-O01-d operational continuity — unit', () => {
  beforeEach(() => {
    resetAnalyticalOwnerBootOutcomes();
  });

  it('owner state transitions: Ready / Unavailable / Degraded only after recovery', () => {
    const recovering = evaluateOwnerOperationalStates({
      bootByOwner: new Map([['reporting', 'ready']]),
      recovering: true,
    });
    expect(recovering.every((o) => o.state === 'Recovering')).toBe(true);

    const mixed = evaluateOwnerOperationalStates({
      bootByOwner: new Map([
        ['knowledge-lake', 'unavailable'],
        ['reporting', 'ready'],
        ['strategy-library', 'ready'],
      ]),
      recovering: false,
    });
    expect(mixed.find((o) => o.owner === 'knowledge-lake')?.state).toBe('Unavailable');
    expect(mixed.find((o) => o.owner === 'reporting')?.state).toBe('Degraded');
    expect(mixed.find((o) => o.owner === 'strategy-library')?.state).toBe('Ready');
  });

  it('readiness evaluation: platform derived from owners only', () => {
    const owners = evaluateOwnerOperationalStates({
      bootByOwner: new Map([
        ['reporting', 'unavailable'],
        ['strategy-library', 'ready'],
      ]),
      recovering: false,
    });
    expect(derivePlatformOperationalState(owners)).toBe('Degraded');
    const projection = buildPlatformOperationalProjection({
      owners,
      recoveryTimestamp: '2026-08-26T00:00:00.000Z',
      recoveryDurationMs: 12,
    });
    expect(projection.platformState).toBe('Degraded');
    expect(projection.unavailableOwners).toContain('reporting');
    expect(projection.recoveryTimestamp).toBe('2026-08-26T00:00:00.000Z');
    expect(projection.recoveryDurationMs).toBe(12);
  });

  it('graceful degradation: healthy owners continue while another is unavailable', () => {
    const owners = evaluateOwnerOperationalStates({
      bootByOwner: new Map([
        ['knowledge-lake', 'unavailable'],
        ['notification-delivery', 'ready'],
        ['strategy-library', 'ready'],
      ]),
      recovering: false,
    });
    expect(owners.find((o) => o.owner === 'notification-delivery')?.state).toBe('Ready');
    expect(healthyOwnersContinueWhileOthersUnavailable(owners)).toBe(true);
  });

  it('rejects unsupported operational states', () => {
    expect(() => assertOperationalState('Healthy')).toThrow(/rejects unsupported state/);
    expect(OPERATIONAL_STATES).toEqual(['Recovering', 'Ready', 'Degraded', 'Unavailable']);
    expect(W3_O01_D_SUPPORTED_STATES).toEqual(OPERATIONAL_STATES);
  });

  it('projection generation via continuity service', async () => {
    const audit = {
      recordOwnerState: vi.fn(async () => undefined),
      recordRecoveryCompleted: vi.fn(async () => undefined),
    } as unknown as OperationalContinuityAudit;
    const service = new OperationalContinuityService(audit);
    const projection = await service.applyBootOutcomesForTest([
      { owner: 'strategy-library', outcome: 'ready' },
      { owner: 'exchange-scope', outcome: 'ready' },
      { owner: 'knowledge-lake', outcome: 'ready' },
      { owner: 'market-profile', outcome: 'ready' },
      { owner: 'market-qualification', outcome: 'ready' },
      { owner: 'market-state', outcome: 'ready' },
      { owner: 'reporting', outcome: 'unavailable', reason: 'corrupt' },
      { owner: 'notification-delivery', outcome: 'ready' },
      { owner: 'trading-orchestrator', outcome: 'ready' },
      { owner: 'runtime-enforcement', outcome: 'ready' },
    ]);
    expect(projection.platformState).toBe('Degraded');
    expect(projection.unavailableOwners).toEqual(['reporting']);
    expect(audit.recordRecoveryCompleted).toHaveBeenCalled();
    expect(audit.recordOwnerState).toHaveBeenCalled();
  });

  it('createRepositoryByDriver memory path records Ready for continuity owner', async () => {
    const previous = process.env.PERSISTENCE_DRIVER;
    process.env.PERSISTENCE_DRIVER = 'memory';
    try {
      class EmptyMemory {
        items: unknown[] = [];
      }
      const repo = await createRepositoryByDriver({
        createMemory: () => new EmptyMemory(),
        createPrisma: () => {
          throw new Error('prisma should not run');
        },
        owner: 'reporting',
      });
      expect(repo).toBeInstanceOf(EmptyMemory);
      expect(getAnalyticalOwnerBootOutcome('reporting')?.outcome).toBe('ready');
    } finally {
      if (previous === undefined) delete process.env.PERSISTENCE_DRIVER;
      else process.env.PERSISTENCE_DRIVER = previous;
    }
  });

  it('unavailable boot outcome isolates owner without fabricating Ready state', () => {
    recordAnalyticalOwnerBootOutcome('reporting', 'unavailable', 'corrupt snapshot');
    const owners = evaluateOwnerOperationalStates({
      bootByOwner: new Map([['reporting', 'unavailable']]),
      recovering: false,
    });
    expect(owners.find((o) => o.owner === 'reporting')?.state).toBe('Unavailable');
    expect(owners.find((o) => o.owner === 'reporting')?.state).not.toBe('Ready');
  });
});

describe('W3-O01-d operational continuity — integration / regression docs', () => {
  it('architecture non-claims and transition safety', () => {
    expect(W3_O01_D_SLICE_ID).toBe('W3-O01-d');
    expect(W3_O01_D_ARCHITECTURE_CLAIMS.businessContinuity).toBe(false);
    expect(W3_O01_D_ARCHITECTURE_CLAIMS.highAvailability).toBe(false);
    expect(W3_O01_D_ARCHITECTURE_CLAIMS.monitoringPlatform).toBe(false);
    expect(W3_O01_D_ARCHITECTURE_CLAIMS.newPersistenceOwner).toBe(false);
    expect(W3_O01_D_ARCHITECTURE_CLAIMS.recoveryContinuesViaW3O01cOnly).toBe(true);
    expect(continuityOwnersMatchDurableSet()).toBe(true);
    expect(transitionSafetyAnswers().noBusinessContinuity).toBe(true);
  });

  it('required reports and operational state matrix exist', () => {
    const wave3 = join(REPO_ROOT, 'docs/project/version-3/wave-3');
    for (const name of [
      'w3-o01-d-implementation-report.md',
      'w3-o01-d-architecture-review.md',
      'w3-o01-d-security-review.md',
      'w3-o01-d-product-review.md',
      'w3-o01-d-validation-report.md',
      'operational-state-matrix.md',
    ]) {
      expect(existsSync(join(wave3, name)), name).toBe(true);
    }
  });
});
