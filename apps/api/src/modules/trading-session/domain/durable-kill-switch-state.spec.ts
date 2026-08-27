import { describe, expect, it } from 'vitest';
import {
  buildArmedKillSwitchState,
  buildClearedKillSwitchState,
  isKillSwitchArmed,
  type DurableKillSwitchState,
} from './durable-kill-switch-state';

const recordedAt = '2026-08-27T18:00:00.000Z';
const clearedAt = '2026-08-27T18:05:00.000Z';

function armedState(overrides: Partial<DurableKillSwitchState> = {}): DurableKillSwitchState {
  const outcome = buildArmedKillSwitchState({
    workspaceId: 'ws-1',
    actorId: 'actor-arm',
    reason: 'operator emergency halt',
    recordedAt,
    prior: null,
  });
  expect(outcome.ok).toBe(true);
  if (!outcome.ok) throw new Error('expected armed');
  return Object.freeze({ ...outcome.state, ...overrides });
}

describe('W3-O04-b — durable Kill Switch state transitions', () => {
  it('buildArmedKillSwitchState persists armed facts without synthetic defaults', () => {
    const outcome = buildArmedKillSwitchState({
      workspaceId: 'ws-1',
      actorId: 'actor-1',
      reason: 'test halt',
      recordedAt,
      prior: null,
    });
    expect(outcome.ok).toBe(true);
    if (!outcome.ok) return;
    expect(outcome.state.armed).toBe(true);
    expect(outcome.state.armedAt).toBe(recordedAt);
    expect(outcome.state.armedByActorId).toBe('actor-1');
    expect(outcome.state.clearedAt).toBeNull();
    expect(outcome.state.clearedByActorId).toBeNull();
    expect(isKillSwitchArmed(outcome.state)).toBe(true);
  });

  it('buildClearedKillSwitchState requires prior armed state', () => {
    const noPrior = buildClearedKillSwitchState({
      workspaceId: 'ws-1',
      actorId: 'actor-clear',
      recordedAt: clearedAt,
      prior: null,
    });
    expect(noPrior.ok).toBe(false);
    if (noPrior.ok) return;
    expect(noPrior.reason).toBe('no_prior_state');

    const disarmed = buildClearedKillSwitchState({
      workspaceId: 'ws-1',
      actorId: 'actor-clear',
      recordedAt: clearedAt,
      prior: Object.freeze({
        ...armedState(),
        armed: false,
      }),
    });
    expect(disarmed.ok).toBe(false);
    if (disarmed.ok) return;
    expect(disarmed.reason).toBe('not_armed');
  });

  it('buildClearedKillSwitchState retains armed attribution after clear', () => {
    const prior = armedState();
    const outcome = buildClearedKillSwitchState({
      workspaceId: 'ws-1',
      actorId: 'actor-clear',
      recordedAt: clearedAt,
      prior,
    });
    expect(outcome.ok).toBe(true);
    if (!outcome.ok) return;
    expect(outcome.state.armed).toBe(false);
    expect(outcome.state.clearedAt).toBe(clearedAt);
    expect(outcome.state.clearedByActorId).toBe('actor-clear');
    expect(outcome.state.armedAt).toBe(prior.armedAt);
    expect(outcome.state.armedByActorId).toBe(prior.armedByActorId);
    expect(isKillSwitchArmed(outcome.state)).toBe(false);
  });

  it('rejects workspace mismatch between prior and command', () => {
    const outcome = buildArmedKillSwitchState({
      workspaceId: 'ws-2',
      actorId: 'actor-1',
      reason: 'halt',
      recordedAt,
      prior: armedState(),
    });
    expect(outcome.ok).toBe(false);
    if (outcome.ok) return;
    expect(outcome.reason).toBe('workspace_mismatch');
  });

  it('isKillSwitchArmed returns false for null or disarmed state', () => {
    expect(isKillSwitchArmed(null)).toBe(false);
    expect(
      isKillSwitchArmed(
        Object.freeze({
          ...armedState(),
          armed: false,
        }),
      ),
    ).toBe(false);
  });
});
