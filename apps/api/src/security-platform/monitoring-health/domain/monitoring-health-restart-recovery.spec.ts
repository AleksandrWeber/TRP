import { describe, expect, it } from 'vitest';
import {
  assertRecoverableMonitoringHealthState,
  buildMonitoringHealthRecoveryDiagnostics,
  MonitoringHealthRestartRecoveryError,
  prepareMonitoringHealthStatesForRecovery,
  sortMonitoringHealthStatesDeterministically,
} from './monitoring-health-restart-recovery';
import {
  buildConnectionHealthAnchorState,
  buildSecurityHealthAnchorState,
} from './durable-monitoring-health-state';

const recordedAt = '2026-08-28T10:00:00.000Z';

function securityAnchor(workspaceId: string) {
  const outcome = buildSecurityHealthAnchorState({
    workspaceId,
    incidentId: 'inc-1',
    actorId: 'actor-1',
    recordedAt,
    prior: null,
  });
  if (!outcome.ok) throw new Error('expected security anchor');
  return outcome.state;
}

function withConnectionAnchor(workspaceId: string) {
  const prior = securityAnchor(workspaceId);
  const outcome = buildConnectionHealthAnchorState({
    workspaceId,
    sessionId: 'sess-9',
    actorId: 'actor-2',
    recordedAt: '2026-08-28T10:05:00.000Z',
    prior,
  });
  if (!outcome.ok) throw new Error('expected connection anchor');
  return outcome.state;
}

describe('W3-O05-c monitoring-health-restart-recovery domain', () => {
  it('prepareMonitoringHealthStatesForRecovery sorts deterministically by workspaceId', () => {
    const recovered = prepareMonitoringHealthStatesForRecovery([
      securityAnchor('ws-b'),
      securityAnchor('ws-a'),
    ]);
    expect(recovered.map((state) => state.workspaceId)).toEqual(['ws-a', 'ws-b']);
  });

  it('missing persisted rows recover as empty', () => {
    const recovered = prepareMonitoringHealthStatesForRecovery([]);
    expect(recovered).toEqual([]);
    expect(buildMonitoringHealthRecoveryDiagnostics(recovered).restoredCount).toBe(0);
  });

  it('corrupt security anchor without recordedAt fails honestly', () => {
    const bad = Object.freeze({
      ...securityAnchor('ws-1'),
      securityHealthAnchorRecordedAt: null,
    });
    expect(() => assertRecoverableMonitoringHealthState(bad)).toThrow(
      MonitoringHealthRestartRecoveryError,
    );
  });

  it('empty persisted row fails honestly', () => {
    const bad = Object.freeze({
      ...securityAnchor('ws-1'),
      securityHealthAnchorIncidentId: null,
      securityHealthAnchorRecordedAt: null,
      securityHealthAnchorRecordedByActorId: null,
    });
    expect(() => assertRecoverableMonitoringHealthState(bad)).toThrow(
      MonitoringHealthRestartRecoveryError,
    );
  });

  it('duplicate workspaceId fails honestly', () => {
    expect(() =>
      prepareMonitoringHealthStatesForRecovery([securityAnchor('ws-1'), securityAnchor('ws-1')]),
    ).toThrow(MonitoringHealthRestartRecoveryError);
  });

  it('recovery idempotency: same input yields same ordered output', () => {
    const input = [withConnectionAnchor('ws-c'), securityAnchor('ws-a'), securityAnchor('ws-b')];
    const first = prepareMonitoringHealthStatesForRecovery(input);
    const second = prepareMonitoringHealthStatesForRecovery(input);
    expect(first).toEqual(second);
    expect(sortMonitoringHealthStatesDeterministically(first)).toEqual(first);
  });

  it('diagnostics report anchor counts and recovery order', () => {
    const diagnostics = buildMonitoringHealthRecoveryDiagnostics([
      withConnectionAnchor('ws-z'),
      securityAnchor('ws-a'),
    ]);
    expect(diagnostics.restoredCount).toBe(2);
    expect(diagnostics.securityHealthAnchorCount).toBe(2);
    expect(diagnostics.connectionHealthAnchorCount).toBe(1);
    expect(diagnostics.recoveryOrder).toEqual(['ws-a', 'ws-z']);
  });
});
