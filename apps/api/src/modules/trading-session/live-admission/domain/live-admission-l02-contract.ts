/**
 * PROPOSED-V3-L01-S04 → L02 contract (PO-S04-12).
 * Documentation / type surface only. L02 remains unauthorized.
 *
 * L02 MUST revalidate safety-critical conditions immediately before
 * irreversible venue I/O. S04 admission is NOT permanent authorization.
 */

import type { LiveAdmissionDecision } from './live-admission-decision';

export type LiveAdmissionL02Contract = Readonly<{
  workspaceId: string;
  sessionId: string | null;
  actorId: string | null;
  admission: LiveAdmissionDecision;
  evaluatedPolicy: LiveAdmissionDecision['evaluatedPolicy'];
  authorization: LiveAdmissionDecision['authorization'];
  gateOutcome: LiveAdmissionDecision['gateOutcome'];
  killSwitch: LiveAdmissionDecision['killSwitch'];
  evaluatedAt: string;
  schemaVersion: LiveAdmissionDecision['schemaVersion'];
  /**
   * Binding reminder for future L02 (not implemented here):
   * revalidate policy, KS, Gate, authz, human-start freshness, and V2 anchors
   * immediately before irreversible venue I/O.
   */
  l02MustRevalidateBeforeVenueIo: true;
}>;

export function toLiveAdmissionL02Contract(
  decision: LiveAdmissionDecision,
): LiveAdmissionL02Contract {
  return Object.freeze({
    workspaceId: decision.workspaceId,
    sessionId: decision.sessionId,
    actorId: decision.actorId,
    admission: decision,
    evaluatedPolicy: decision.evaluatedPolicy,
    authorization: decision.authorization,
    gateOutcome: decision.gateOutcome,
    killSwitch: decision.killSwitch,
    evaluatedAt: decision.evaluatedAt,
    schemaVersion: decision.schemaVersion,
    l02MustRevalidateBeforeVenueIo: true as const,
  });
}
