/**
 * PROPOSED-V3-L01-S04 / V3-L02-S-HS1 — Live admission evaluator service.
 *
 * Orchestrates snapshot inputs into decideLiveAdmission.
 * No Security Audit persistence of runtime decisions (PO-S04-11).
 * No exchange I/O. No C7 activation. No Vault.
 *
 * Human-start: evaluate verifies without claim (PO-L02-05B/D).
 * claimHumanStartAfterS04Revalidation: S04 revalidate → atomic claim.
 * Claim ≠ submit ≠ accept ≠ fill. Venue I/O is out of HS1 scope.
 */

import { Inject, Injectable, Optional } from '@nestjs/common';
import { decideAuthorization } from '../../auth/authorization-decision';
import { PermissionClass } from '../../auth/permission-catalog';
import type { Role } from '../../identity/role';
import { WorkspaceLivePolicyPersistenceService } from '../../workspace/live-policy/workspace-live-policy-persistence.service';
import { WorkspaceLivePolicy } from '../../workspace/live-policy/durable-workspace-live-policy-state';
import { KillSwitchPersistenceService } from '../kill-switch/kill-switch-persistence.service';
import { decideLiveAdmission } from './domain/decide-live-admission';
import type { LiveAdmissionDecision } from './domain/live-admission-decision';
import { mapGateToAdmissionInput } from './domain/gate-admission-input';
import {
  claimHumanStartProof,
  issueHumanStartProof,
  verifyHumanStartProof,
  type HumanStartClaimResult,
  type HumanStartProofStore,
  type IssuedHumanStartProof,
} from './domain/human-start-proof';
import { mapKillSwitchToAdmissionInput } from './domain/kill-switch-admission-input';
import {
  toLiveAdmissionL02Contract,
  type LiveAdmissionL02Contract,
} from './domain/live-admission-l02-contract';
import { mapPolicyToAdmissionInput } from './domain/policy-admission-input';
import {
  evaluateSessionLiveEligibility,
  type LiveAdmissionSessionFacts,
} from './domain/session-live-eligibility';
import { buildV2LiveAdmissionSnapshot } from './domain/v2-live-admission-prerequisites';
import { InMemoryHumanStartProofStore } from './in-memory-human-start-proof.store';
import { HUMAN_START_PROOF_STORE } from './human-start-proof.tokens';
import {
  LIVE_ADMISSION_GATE_PORT,
  type LiveAdmissionGatePort,
  type LiveAdmissionGateRequest,
} from './live-admission-gate.port';

export type EvaluateLiveAdmissionCommand = Readonly<{
  workspaceId: string;
  sessionId: string;
  actorId: string;
  actorRole: Role;
  /** Presented human-start token — JWT alone is insufficient. */
  humanStartToken?: string | null;
  /**
   * ACTION/COMMAND the proof must authorize (PO-L02-05 grain).
   * Required when a human-start token is presented.
   */
  actionCommand?: string | null;
  /** Session facts (caller supplies minimal eligibility facts). */
  session: LiveAdmissionSessionFacts | null;
  /** Optional Gate request fields for LIVE_ADMISSION_GATE_PORT. */
  gateRequest?: Partial<
    Pick<
      LiveAdmissionGateRequest,
      'libraryEntryId' | 'strategyFamilyId' | 'strategyVersion' | 'exchangeScopeId' | 'tacticPoint'
    >
  >;
  /**
   * Test / harness overrides — MUST NOT be used to weaken production anchors
   * in real composition. Production path omits overrides.
   */
  v2Overrides?: {
    liveCapitalAuthorized?: boolean;
    paperFreezeBlocksLive?: boolean;
  };
  /**
   * Optional authorization override for pure harnesses.
   * Production evaluates LiveCommand (C7) — remains deny-all.
   */
  authorizationOverride?: 'allowed' | 'denied' | 'unknown';
  evaluatedAt?: string;
}>;

export type ClaimHumanStartAfterS04Command = EvaluateLiveAdmissionCommand &
  Readonly<{
    actionCommand: string;
    claimedLogicalActionId?: string | null;
  }>;

/**
 * Authorization-claim outcome only. Never encodes venue SUBMITTED/ACCEPTED/FILLED.
 */
export type ClaimHumanStartAfterS04Result =
  | Readonly<{
      status: 'claimed';
      proofId: string;
      claimedAt: string;
      actionCommand: string;
      admission: LiveAdmissionDecision;
    }>
  | Readonly<{
      status: 'admission_denied';
      admission: LiveAdmissionDecision;
    }>
  | Readonly<{
      status: 'claim_denied';
      reason: Exclude<HumanStartClaimResult['status'], 'claimed'>;
      admission: LiveAdmissionDecision;
    }>;

@Injectable()
export class LiveAdmissionService {
  private readonly humanStartStore: HumanStartProofStore;

  constructor(
    @Inject(WorkspaceLivePolicyPersistenceService)
    private readonly livePolicy: WorkspaceLivePolicyPersistenceService,
    @Inject(KillSwitchPersistenceService)
    private readonly killSwitch: KillSwitchPersistenceService,
    @Inject(LIVE_ADMISSION_GATE_PORT)
    private readonly gate: LiveAdmissionGatePort,
    @Optional()
    @Inject(HUMAN_START_PROOF_STORE)
    humanStartStore?: HumanStartProofStore,
  ) {
    this.humanStartStore = humanStartStore ?? new InMemoryHumanStartProofStore();
  }

  /** Issue a human-start proof bound to actor/workspace/session/ACTION (PO-L02-05). */
  async issueHumanStart(input: {
    actorId: string;
    workspaceId: string;
    sessionId: string;
    actionCommand: string;
    nowIso?: string;
  }): Promise<IssuedHumanStartProof> {
    const nowIso = input.nowIso ?? new Date().toISOString();
    const { record, issued } = issueHumanStartProof({
      actorId: input.actorId,
      workspaceId: input.workspaceId,
      sessionId: input.sessionId,
      actionCommand: input.actionCommand,
      nowIso,
    });
    await this.humanStartStore.save(record);
    return issued;
  }

  /**
   * Evaluate fail-closed live admission.
   * ALLOW ≠ execution. Does not persist Security Audit events.
   * Human-start is verified without claim (PO-L02-05B).
   */
  async evaluate(command: EvaluateLiveAdmissionCommand): Promise<LiveAdmissionDecision> {
    const evaluatedAt = command.evaluatedAt ?? new Date().toISOString();
    const v2 = buildV2LiveAdmissionSnapshot(command.v2Overrides);

    const policyInput = await this.loadPolicyInput(command.workspaceId);
    const killSwitchInput = await this.loadKillSwitchInput(command.workspaceId);
    const authorization =
      command.authorizationOverride ?? this.evaluateLiveCommandAuthorization(command.actorRole);
    const sessionInput = evaluateSessionLiveEligibility({
      session: command.session,
      expectedWorkspaceId: command.workspaceId,
      expectedSessionId: command.sessionId,
      expectedActorId: command.actorId,
    });
    const humanStart = await this.evaluateHumanStart(command, evaluatedAt);
    const gateInput = this.evaluateGate(command, evaluatedAt);

    return decideLiveAdmission({
      workspaceId: command.workspaceId,
      sessionId: command.sessionId,
      actorId: command.actorId,
      evaluatedAt,
      liveCapitalAuthorized: v2.liveCapitalAuthorized,
      paperFreezeBlocksLive: v2.paperFreezeBlocksLive,
      policy: policyInput,
      killSwitch: killSwitchInput,
      authorization,
      session: sessionInput,
      humanStart,
      gate: gateInput,
    });
  }

  /** S04 → L02 contract projection (L02 unauthorized / not implemented). */
  async evaluateForL02Contract(
    command: EvaluateLiveAdmissionCommand,
  ): Promise<LiveAdmissionL02Contract> {
    const decision = await this.evaluate(command);
    return toLiveAdmissionL02Contract(decision);
  }

  /**
   * Mandatory ordering (PO-L02-05B/D):
   * S04 revalidation → atomic human-start claim.
   * Does NOT perform venue I/O. Claim ≠ SUBMITTED/ACCEPTED/FILLED.
   *
   * Integration point for later live Engine: call this immediately before
   * irreversible venue I/O; do not claim earlier in admission-only evaluate().
   */
  async claimHumanStartAfterS04Revalidation(
    command: ClaimHumanStartAfterS04Command,
  ): Promise<ClaimHumanStartAfterS04Result> {
    const evaluatedAt = command.evaluatedAt ?? new Date().toISOString();
    const admission = await this.evaluate({
      ...command,
      actionCommand: command.actionCommand,
      evaluatedAt,
    });
    if (!admission.allowed) {
      return Object.freeze({ status: 'admission_denied', admission });
    }

    const claim = await claimHumanStartProof({
      store: this.humanStartStore,
      presentedToken: command.humanStartToken,
      expectedActorId: command.actorId,
      expectedWorkspaceId: command.workspaceId,
      expectedSessionId: command.sessionId,
      expectedActionCommand: command.actionCommand,
      nowIso: evaluatedAt,
      claimedLogicalActionId: command.claimedLogicalActionId ?? null,
    });

    if (claim.status !== 'claimed') {
      return Object.freeze({
        status: 'claim_denied',
        reason: claim.status,
        admission,
      });
    }

    return Object.freeze({
      status: 'claimed',
      proofId: claim.record.id,
      claimedAt: claim.record.claimedAt!,
      actionCommand: claim.record.actionCommand,
      admission,
    });
  }

  /**
   * Production authorization prerequisite: LiveCommand (C7).
   * Remains deny-all for all roles — S04 does not activate C7 (PO-S04-02).
   */
  evaluateLiveCommandAuthorization(role: Role): 'allowed' | 'denied' {
    const decision = decideAuthorization({
      role,
      action: PermissionClass.LiveCommand,
    });
    return decision.allowed ? 'allowed' : 'denied';
  }

  private async loadPolicyInput(workspaceId: string) {
    try {
      const state = await this.livePolicy.loadState(workspaceId);
      if (state === null) {
        // Effective PAPER via resolveEffectivePolicy — treat as PAPER deny for live.
        const effective = await this.livePolicy.resolveEffectivePolicy(workspaceId);
        if (effective === WorkspaceLivePolicy.PAPER) {
          return mapPolicyToAdmissionInput({ status: 'ok', policy: WorkspaceLivePolicy.PAPER });
        }
        return mapPolicyToAdmissionInput({ status: 'missing' });
      }
      return mapPolicyToAdmissionInput({ status: 'ok', policy: state.policy });
    } catch {
      return mapPolicyToAdmissionInput({ status: 'unknown' });
    }
  }

  private async loadKillSwitchInput(workspaceId: string) {
    try {
      const state = await this.killSwitch.loadState(workspaceId);
      return mapKillSwitchToAdmissionInput({ status: 'ok', state });
    } catch {
      return mapKillSwitchToAdmissionInput({ status: 'unavailable' });
    }
  }

  private async evaluateHumanStart(
    command: EvaluateLiveAdmissionCommand,
    nowIso: string,
  ): Promise<
    | 'valid'
    | 'missing'
    | 'invalid'
    | 'expired'
    | 'replayed'
    | 'actor_mismatch'
    | 'workspace_mismatch'
    | 'session_mismatch'
    | 'action_mismatch'
  > {
    // JWT alone / omitted token → missing (PO-S04-06). Verify without claim (PO-L02-05B).
    const result = await verifyHumanStartProof({
      store: this.humanStartStore,
      presentedToken: command.humanStartToken,
      expectedActorId: command.actorId,
      expectedWorkspaceId: command.workspaceId,
      expectedSessionId: command.sessionId,
      expectedActionCommand: command.actionCommand ?? '',
      nowIso,
    });
    return result.status;
  }

  private evaluateGate(
    command: EvaluateLiveAdmissionCommand,
    evaluatedAt: string,
  ): 'pass' | 'fail' | 'unknown' | 'unavailable' {
    const gateRequest = command.gateRequest;
    const hasIdentity =
      gateRequest !== undefined &&
      (typeof gateRequest.libraryEntryId === 'string' ||
        (typeof gateRequest.strategyFamilyId === 'string' &&
          typeof gateRequest.strategyVersion === 'string'));
    if (!hasIdentity) {
      return mapGateToAdmissionInput({ status: 'unavailable' });
    }
    try {
      const decision = this.gate.validateForLiveAdmission({
        workspaceId: command.workspaceId,
        tradingSessionId: command.sessionId,
        requestedAt: evaluatedAt,
        libraryEntryId: gateRequest.libraryEntryId,
        strategyFamilyId: gateRequest.strategyFamilyId,
        strategyVersion: gateRequest.strategyVersion,
        exchangeScopeId: gateRequest.exchangeScopeId,
        tacticPoint: gateRequest.tacticPoint,
      });
      return mapGateToAdmissionInput({ status: 'ok', decision });
    } catch {
      return mapGateToAdmissionInput({ status: 'unavailable' });
    }
  }
}
