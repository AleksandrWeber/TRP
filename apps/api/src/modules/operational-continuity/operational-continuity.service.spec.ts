import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  evaluateOwnerOperationalStates,
  healthyOwnersContinueWhileOthersUnavailable,
} from './operational-readiness';
import { OperationalContinuityService } from './operational-continuity.service';
import { OperationalContinuityAudit } from './operational-continuity-audit';
import { resetAnalyticalOwnerBootOutcomes } from '../../persistence/analytical-owner-continuity-status';

describe('OperationalContinuityService', () => {
  beforeEach(() => {
    resetAnalyticalOwnerBootOutcomes();
  });

  it('mixed owner states: unavailable + ready + degraded dependents', async () => {
    const audit = {
      recordOwnerState: vi.fn(async () => undefined),
      recordRecoveryCompleted: vi.fn(async () => undefined),
    } as unknown as OperationalContinuityAudit;
    const service = new OperationalContinuityService(audit);
    const projection = await service.applyBootOutcomesForTest([
      { owner: 'strategy-library', outcome: 'ready' },
      { owner: 'exchange-scope', outcome: 'unavailable', reason: 'hydrate failed' },
      { owner: 'knowledge-lake', outcome: 'ready' },
      { owner: 'market-profile', outcome: 'ready' },
      { owner: 'market-qualification', outcome: 'ready' },
      { owner: 'market-state', outcome: 'ready' },
      { owner: 'reporting', outcome: 'ready' },
      { owner: 'notification-delivery', outcome: 'ready' },
      { owner: 'trading-orchestrator', outcome: 'ready' },
      { owner: 'runtime-enforcement', outcome: 'ready' },
    ]);

    expect(projection.unavailableOwners).toContain('exchange-scope');
    expect(projection.degradedOwners).toContain('market-qualification');
    expect(projection.degradedOwners).toContain('market-state');
    expect(projection.degradedOwners).toContain('trading-orchestrator');
    expect(projection.ownerStates.find((o) => o.owner === 'notification-delivery')?.state).toBe(
      'Ready',
    );
    expect(projection.platformState).toBe('Degraded');
    expect(healthyOwnersContinueWhileOthersUnavailable(projection.ownerStates)).toBe(true);
  });

  it('all ready → platform Ready with recovery timestamp', async () => {
    const audit = {
      recordOwnerState: vi.fn(async () => undefined),
      recordRecoveryCompleted: vi.fn(async () => undefined),
    } as unknown as OperationalContinuityAudit;
    const service = new OperationalContinuityService(audit);
    const projection = await service.applyBootOutcomesForTest(
      (
        [
          'strategy-library',
          'exchange-scope',
          'knowledge-lake',
          'market-profile',
          'market-qualification',
          'market-state',
          'reporting',
          'notification-delivery',
          'trading-orchestrator',
          'runtime-enforcement',
        ] as const
      ).map((owner) => ({ owner, outcome: 'ready' as const })),
    );
    expect(projection.platformState).toBe('Ready');
    expect(projection.unavailableOwners).toEqual([]);
    expect(projection.degradedOwners).toEqual([]);
    expect(projection.recoveryTimestamp).toBeTruthy();
    expect(typeof projection.recoveryDurationMs).toBe('number');
  });

  it('workspace-safe projection is read-only (no mutation API on service)', () => {
    const owners = evaluateOwnerOperationalStates({
      bootByOwner: new Map(),
      recovering: false,
    });
    expect(Object.isFrozen(owners)).toBe(true);
  });
});
