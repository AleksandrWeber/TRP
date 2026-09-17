/**
 * Production adapter: LiveAdmissionGatePort → RuntimeEnforcementPort.
 *
 * Bound at composition root so Trading Session never imports Enforcement
 * (RC-23 / RC-28 Session → Enforcement dependency direction).
 */

import { Inject, Injectable } from '@nestjs/common';
import {
  RUNTIME_ENFORCEMENT_PORT,
  type RuntimeEnforcementPort,
} from '../modules/runtime-enforcement/ports/runtime-enforcement.port';
import type {
  LiveAdmissionGateDecision,
  LiveAdmissionGatePort,
  LiveAdmissionGateRequest,
} from '../modules/trading-session/live-admission/live-admission-gate.port';

@Injectable()
export class RealLiveAdmissionGatePort implements LiveAdmissionGatePort {
  constructor(
    @Inject(RUNTIME_ENFORCEMENT_PORT)
    private readonly enforcement: RuntimeEnforcementPort,
  ) {}

  validateForLiveAdmission(request: LiveAdmissionGateRequest): LiveAdmissionGateDecision {
    const decision = this.enforcement.validateDeployment({
      workspaceId: request.workspaceId,
      purpose: 'session_start',
      tradingSessionId: request.tradingSessionId,
      requestedAt: request.requestedAt,
      libraryEntryId: request.libraryEntryId,
      strategyFamilyId: request.strategyFamilyId,
      strategyVersion: request.strategyVersion,
      exchangeScopeId: request.exchangeScopeId,
      tacticPoint: request.tacticPoint,
    });
    return Object.freeze({
      outcome: decision.outcome,
      validation: decision.validation,
    });
  }
}
