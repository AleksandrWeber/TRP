import { describe, expect, it } from 'vitest';
import {
  assertRecoverableKillSwitchState,
  buildKillSwitchRecoveryDiagnostics,
  KillSwitchRestartRecoveryError,
  prepareKillSwitchStatesForRecovery,
  sortKillSwitchStatesDeterministically,
} from './kill-switch-restart-recovery';
import { buildArmedKillSwitchState } from './durable-kill-switch-state';

const recordedAt = '2026-08-27T18:00:00.000Z';

function armed(workspaceId: string) {
  const outcome = buildArmedKillSwitchState({
    workspaceId,
    actorId: 'actor-1',
    reason: 'halt',
    recordedAt,
    prior: null,
  });
  if (!outcome.ok) throw new Error('expected armed');
  return outcome.state;
}

describe('W3-O04-c kill-switch-restart-recovery domain', () => {
  it('prepareKillSwitchStatesForRecovery sorts deterministically by workspaceId', () => {
    const recovered = prepareKillSwitchStatesForRecovery([armed('ws-b'), armed('ws-a')]);
    expect(recovered.map((state) => state.workspaceId)).toEqual(['ws-a', 'ws-b']);
  });

  it('missing persisted rows recover as empty', () => {
    const recovered = prepareKillSwitchStatesForRecovery([]);
    expect(recovered).toEqual([]);
    expect(buildKillSwitchRecoveryDiagnostics(recovered).restoredCount).toBe(0);
  });

  it('corrupt armed state without armedAt fails honestly', () => {
    const bad = Object.freeze({
      ...armed('ws-1'),
      armedAt: null,
    });
    expect(() => assertRecoverableKillSwitchState(bad)).toThrow(KillSwitchRestartRecoveryError);
  });

  it('duplicate workspaceId fails honestly', () => {
    expect(() => prepareKillSwitchStatesForRecovery([armed('ws-1'), armed('ws-1')])).toThrow(
      KillSwitchRestartRecoveryError,
    );
  });

  it('recovery idempotency: same input yields same ordered output', () => {
    const input = [armed('ws-c'), armed('ws-a'), armed('ws-b')];
    const first = prepareKillSwitchStatesForRecovery(input);
    const second = prepareKillSwitchStatesForRecovery(input);
    expect(first).toEqual(second);
    expect(sortKillSwitchStatesDeterministically(first)).toEqual(first);
  });

  it('diagnostics report armed count and recovery order', () => {
    const diagnostics = buildKillSwitchRecoveryDiagnostics([armed('ws-z'), armed('ws-a')]);
    expect(diagnostics.restoredCount).toBe(2);
    expect(diagnostics.armedCount).toBe(2);
    expect(diagnostics.recoveryOrder).toEqual(['ws-a', 'ws-z']);
  });
});
