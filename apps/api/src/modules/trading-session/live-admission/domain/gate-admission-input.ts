/**
 * PROPOSED-V3-L01-S04 — Map Gate decision projection to admission input.
 * Consumes LiveAdmissionGatePort — does not create a second Gate.
 */

import type { LiveAdmissionGateDecision } from '../live-admission-gate.port';
import type { LiveAdmissionGateInput } from './decide-live-admission';

export type GateLoadResult =
  | Readonly<{ status: 'ok'; decision: LiveAdmissionGateDecision }>
  | Readonly<{ status: 'unavailable' }>
  | Readonly<{ status: 'unknown' }>;

export function mapGateToAdmissionInput(load: GateLoadResult): LiveAdmissionGateInput {
  if (load.status === 'unavailable') return 'unavailable';
  if (load.status === 'unknown') return 'unknown';
  if (load.decision.outcome === 'pass' && load.decision.validation === 'VALID') {
    return 'pass';
  }
  if (load.decision.outcome === 'fail' || load.decision.validation === 'INVALID') {
    return 'fail';
  }
  return 'unknown';
}
