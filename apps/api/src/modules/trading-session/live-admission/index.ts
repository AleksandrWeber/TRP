/**
 * PROPOSED-V3-L01-S04 — Live admission public exports.
 */

export {
  decideLiveAdmission,
  type DecideLiveAdmissionInput,
  type LiveAdmissionAuthorizationInput,
  type LiveAdmissionGateInput,
  type LiveAdmissionHumanStartInput,
  type LiveAdmissionKillSwitchInput,
  type LiveAdmissionPolicyInput,
  type LiveAdmissionSessionInput,
} from './domain/decide-live-admission';
export {
  LIVE_ADMISSION_DECISION_SCHEMA_VERSION,
  toPublicAdmissionReason,
  type LiveAdmissionDecision,
  type LiveAdmissionOutcome,
  type LiveAdmissionPublicReason,
  type LiveAdmissionReasonCode,
} from './domain/live-admission-decision';
export {
  HUMAN_START_PROOF_TTL_MS,
  HUMAN_START_PROOF_SCHEMA_VERSION,
  hashHumanStartToken,
  issueHumanStartProof,
  verifyHumanStartProof,
  claimHumanStartProof,
  verifyAndConsumeHumanStartProof,
  type HumanStartProofRecord,
  type HumanStartProofStore,
  type HumanStartVerifyResult,
  type HumanStartClaimResult,
  type HumanStartClaimBindings,
  type HumanStartDenialStatus,
  type IssuedHumanStartProof,
} from './domain/human-start-proof';
export {
  aggregateSessionToLiveAdmissionFacts,
  durableSessionToLiveAdmissionFacts,
  evaluateSessionLiveEligibility,
  type LiveAdmissionSessionFacts,
} from './domain/session-live-eligibility';
export {
  buildV2LiveAdmissionSnapshot,
  readLiveCapitalAuthorizedAnchor,
  readPaperFreezeBlocksLive,
} from './domain/v2-live-admission-prerequisites';
export {
  mapKillSwitchToAdmissionInput,
  type KillSwitchLoadResult,
} from './domain/kill-switch-admission-input';
export { mapGateToAdmissionInput, type GateLoadResult } from './domain/gate-admission-input';
export {
  mapPolicyToAdmissionInput,
  parsePolicyTokenFailClosed,
  type PolicyLoadResult,
} from './domain/policy-admission-input';
export {
  toLiveAdmissionL02Contract,
  type LiveAdmissionL02Contract,
} from './domain/live-admission-l02-contract';
export { InMemoryHumanStartProofStore } from './in-memory-human-start-proof.store';
export { PrismaHumanStartProofStore } from './prisma-human-start-proof.store';
export { HUMAN_START_PROOF_STORE } from './human-start-proof.tokens';
export {
  LiveAdmissionService,
  type EvaluateLiveAdmissionCommand,
  type ClaimHumanStartAfterS04Command,
  type ClaimHumanStartAfterS04Result,
} from './live-admission.service';
export { LiveAdmissionModule } from './live-admission.module';
export {
  LIVE_ADMISSION_GATE_PORT,
  UnavailableLiveAdmissionGatePort,
  type LiveAdmissionGateDecision,
  type LiveAdmissionGatePort,
  type LiveAdmissionGateRequest,
} from './live-admission-gate.port';
