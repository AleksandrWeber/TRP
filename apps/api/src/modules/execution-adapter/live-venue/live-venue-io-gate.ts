/**
 * V3-L02-S-ADP1 — Irreversible live I/O preconditions (S04 + HS1 claim).
 *
 * Sequence:
 *   S04 evaluateForL02Contract / evaluate
 *        ↓
 *   atomic human-start claim
 *        ↓
 *   ALLOW for adapter I/O (claim ≠ submitted)
 *
 * Does not contact venues. Does not import EmergencyManager.
 */

import type { Role } from '../../identity/role';
import type {
  ClaimHumanStartAfterS04Result,
  LiveAdmissionService,
} from '../../trading-session/live-admission/live-admission.service';
import type { LiveAdmissionSessionFacts } from '../../trading-session/live-admission/domain/session-live-eligibility';
import type { LiveAdmissionL02Contract } from '../../trading-session/live-admission/domain/live-admission-l02-contract';

export const LIVE_VENUE_IO_ACTION_SUBMIT = 'LIVE_ORDER_SUBMIT' as const;
export const LIVE_VENUE_IO_ACTION_CANCEL = 'LIVE_ORDER_CANCEL' as const;

export type LiveVenueIoGateCommand = Readonly<{
  workspaceId: string;
  sessionId: string;
  actorId: string;
  actorRole: Role;
  humanStartToken: string;
  actionCommand: typeof LIVE_VENUE_IO_ACTION_SUBMIT | typeof LIVE_VENUE_IO_ACTION_CANCEL | string;
  session: LiveAdmissionSessionFacts | null;
  claimedLogicalActionId?: string | null;
  evaluatedAt?: string;
  /** Gate identity for S04 — required for ALLOW (otherwise GATE_UNAVAILABLE). */
  gateRequest?: {
    libraryEntryId?: string;
    strategyFamilyId?: string;
    strategyVersion?: string;
    exchangeScopeId?: string;
    tacticPoint?: string;
  };
  /** Harness overrides only — production omits (C7 remains deny-all). */
  v2Overrides?: {
    liveCapitalAuthorized?: boolean;
    paperFreezeBlocksLive?: boolean;
  };
  authorizationOverride?: 'allowed' | 'denied' | 'unknown';
}>;

export type LiveVenueIoGateResult =
  | Readonly<{
      ok: true;
      proofId: string;
      claimedAt: string;
      actionCommand: string;
      admissionContract: LiveAdmissionL02Contract;
      /** Explicit: claim is not venue submission. */
      claimMeansVenueSubmitted: false;
    }>
  | Readonly<{
      ok: false;
      reason:
        | 's04_denied'
        | 'human_start_claim_denied'
        | 'c7_denied'
        | 'policy_paper'
        | 'kill_switch_active'
        | 'session_ineligible'
        | 'human_start_invalid'
        | 'human_start_expired'
        | 'human_start_already_claimed'
        | 'workspace_mismatch'
        | 'actor_mismatch'
        | 'session_mismatch';
      detail?: string;
      claim?: ClaimHumanStartAfterS04Result;
    }>;

/**
 * Call immediately before irreversible live adapter I/O.
 * claim ≠ SUBMITTED / ACCEPTED / FILLED.
 */
export async function assertLiveVenueIoPreconditions(input: {
  admission: LiveAdmissionService;
  command: LiveVenueIoGateCommand;
}): Promise<LiveVenueIoGateResult> {
  const contract = await input.admission.evaluateForL02Contract({
    workspaceId: input.command.workspaceId,
    sessionId: input.command.sessionId,
    actorId: input.command.actorId,
    actorRole: input.command.actorRole,
    humanStartToken: input.command.humanStartToken,
    actionCommand: input.command.actionCommand,
    session: input.command.session,
    gateRequest: input.command.gateRequest,
    v2Overrides: input.command.v2Overrides,
    authorizationOverride: input.command.authorizationOverride,
    evaluatedAt: input.command.evaluatedAt,
  });

  if (!contract.admission.allowed) {
    return Object.freeze({
      ok: false,
      reason: mapAdmissionDenyReason(contract.admission.reason),
      detail: contract.admission.reason,
    });
  }

  const claim = await input.admission.claimHumanStartAfterS04Revalidation({
    workspaceId: input.command.workspaceId,
    sessionId: input.command.sessionId,
    actorId: input.command.actorId,
    actorRole: input.command.actorRole,
    humanStartToken: input.command.humanStartToken,
    actionCommand: input.command.actionCommand,
    session: input.command.session,
    claimedLogicalActionId: input.command.claimedLogicalActionId ?? null,
    gateRequest: input.command.gateRequest,
    v2Overrides: input.command.v2Overrides,
    authorizationOverride: input.command.authorizationOverride,
    evaluatedAt: input.command.evaluatedAt,
  });

  if (claim.status === 'admission_denied') {
    return Object.freeze({
      ok: false,
      reason: 's04_denied',
      claim,
    });
  }
  if (claim.status === 'claim_denied') {
    return Object.freeze({
      ok: false,
      reason: mapClaimDenyReason(claim.reason),
      detail: claim.reason,
      claim,
    });
  }

  return Object.freeze({
    ok: true,
    proofId: claim.proofId,
    claimedAt: claim.claimedAt,
    actionCommand: claim.actionCommand,
    admissionContract: contract,
    claimMeansVenueSubmitted: false as const,
  });
}

function mapAdmissionDenyReason(
  code: string,
): Extract<LiveVenueIoGateResult, { ok: false }>['reason'] {
  if (code.includes('AUTHORIZATION')) return 'c7_denied';
  if (code.includes('KILL')) return 'kill_switch_active';
  if (code.includes('PAPER_POLICY') || code.includes('POLICY')) return 'policy_paper';
  if (code.includes('SESSION')) return 'session_ineligible';
  if (code.includes('HUMAN_START_EXPIRED')) return 'human_start_expired';
  if (code.includes('HUMAN_START')) return 'human_start_invalid';
  if (code.includes('WORKSPACE')) return 'workspace_mismatch';
  if (code.includes('ACTOR')) return 'actor_mismatch';
  return 's04_denied';
}

function mapClaimDenyReason(
  reason: string,
): Extract<LiveVenueIoGateResult, { ok: false }>['reason'] {
  if (reason === 'expired') return 'human_start_expired';
  if (reason === 'already_claimed' || reason === 'replayed') {
    return 'human_start_already_claimed';
  }
  if (reason === 'workspace_mismatch') return 'workspace_mismatch';
  if (reason === 'actor_mismatch') return 'actor_mismatch';
  if (reason === 'session_mismatch') return 'session_mismatch';
  return 'human_start_claim_denied';
}
