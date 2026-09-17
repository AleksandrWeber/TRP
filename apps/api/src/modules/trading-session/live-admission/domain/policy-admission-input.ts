/**
 * PROPOSED-V3-L01-S04 — Map S02/S03 WorkspaceLivePolicy to admission input.
 */

import {
  parseWorkspaceLivePolicy,
  WorkspaceLivePolicy,
} from '../../../workspace/live-policy/durable-workspace-live-policy-state';
import type { LiveAdmissionPolicyInput } from './decide-live-admission';

export type PolicyLoadResult =
  | Readonly<{ status: 'ok'; policy: WorkspaceLivePolicy }>
  | Readonly<{ status: 'missing' }>
  | Readonly<{ status: 'invalid'; message?: string }>
  | Readonly<{ status: 'unknown' }>;

export function mapPolicyToAdmissionInput(load: PolicyLoadResult): LiveAdmissionPolicyInput {
  if (load.status === 'missing') return 'MISSING';
  if (load.status === 'invalid') return 'INVALID';
  if (load.status === 'unknown') return 'UNKNOWN';
  if (load.policy === WorkspaceLivePolicy.PAPER) return 'PAPER';
  if (load.policy === WorkspaceLivePolicy.LIVE_POLICY_OPTED_IN) return 'LIVE_POLICY_OPTED_IN';
  return 'INVALID';
}

/** Parse raw token fail-closed — never coerces to live. */
export function parsePolicyTokenFailClosed(value: unknown): PolicyLoadResult {
  if (value === null || value === undefined) {
    return Object.freeze({ status: 'missing' });
  }
  try {
    return Object.freeze({ status: 'ok', policy: parseWorkspaceLivePolicy(value) });
  } catch {
    return Object.freeze({ status: 'invalid' });
  }
}
