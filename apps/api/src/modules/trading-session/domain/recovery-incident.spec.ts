import { describe, expect, it } from 'vitest';
import { createRecoveryIncident } from './recovery-incident';

const at = '2026-08-01T12:00:00.000Z';

describe('US293 — RecoveryIncident domain', () => {
  it('creates a minimal open blocking Incident without RecoveryState ownership', () => {
    const incident = createRecoveryIncident({
      workspaceId: 'ws-1',
      sessionId: 'session-1',
      recoveryId: 'recovery-1',
      recoveryAttempt: 2,
      reasonClass: 'reconciliation_ambiguity',
      failureReason: 'reconcile:orders_mismatch',
      createdAt: at,
    });

    expect(incident.status).toBe('OPEN');
    expect(incident.blocking).toBe(true);
    expect(incident.incidentId.length).toBeGreaterThan(0);
    expect(incident.workspaceId).toBe('ws-1');
    expect(incident.sessionId).toBe('session-1');
    expect(incident.recoveryId).toBe('recovery-1');
    expect(incident.reasonClass).toBe('reconciliation_ambiguity');
    // Incident correlates recovery identity only — does not embed RecoveryState lifecycle.
    expect(incident).not.toHaveProperty('phase');
    expect(incident).not.toHaveProperty('resumeIntent');
  });

  it('reuses provided incidentId for idempotent re-entry', () => {
    const incident = createRecoveryIncident({
      workspaceId: 'ws-1',
      sessionId: 'session-1',
      reasonClass: 'checkpoint_corruption',
      failureReason: 'checkpoint:schema_mismatch',
      createdAt: at,
      incidentId: 'inc-fixed',
    });
    expect(incident.incidentId).toBe('inc-fixed');
  });

  it('rejects secret-shaped failure payloads', () => {
    expect(() =>
      createRecoveryIncident({
        workspaceId: 'ws-1',
        sessionId: 'session-1',
        reasonClass: 'data_corruption',
        failureReason: 'api_key=sk-secret',
        createdAt: at,
      }),
    ).toThrow(/secrets/);
  });
});
