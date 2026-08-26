/**
 * W3-O01-d — Security Audit emits for Operational Continuity.
 * Reuses existing Security Audit Product. Catalog admission required.
 */

import { Injectable } from '@nestjs/common';
import { SecurityAuditService } from '../security-audit/security-audit.service';
import type { OperationalState } from './operational-readiness';
import type { W3O01CRecoveryOwner } from '../../persistence/analytical-restart-recovery';

export const CONTINUITY_AUDIT_EVENT_TYPES = Object.freeze({
  recoveryCompleted: 'continuity.recovery-completed',
  ownerReady: 'continuity.owner-ready',
  ownerDegraded: 'continuity.owner-degraded',
  ownerUnavailable: 'continuity.owner-unavailable',
} as const);

@Injectable()
export class OperationalContinuityAudit {
  constructor(private readonly audit: SecurityAuditService) {}

  async recordRecoveryCompleted(input: {
    platformState: OperationalState;
    recoveryDurationMs: number;
    unavailableOwners: readonly string[];
    degradedOwners: readonly string[];
  }): Promise<void> {
    await this.audit.record({
      eventType: CONTINUITY_AUDIT_EVENT_TYPES.recoveryCompleted,
      outcome: 'Operational Recovery Completed',
      source: 'operational-continuity',
      attribution: {},
      payload: {
        platformState: input.platformState,
        recoveryDurationMs: input.recoveryDurationMs,
        unavailableOwners: [...input.unavailableOwners],
        degradedOwners: [...input.degradedOwners],
      },
    });
  }

  async recordOwnerState(input: {
    owner: W3O01CRecoveryOwner;
    state: 'Ready' | 'Degraded' | 'Unavailable';
    reason?: string;
  }): Promise<void> {
    const eventType =
      input.state === 'Ready'
        ? CONTINUITY_AUDIT_EVENT_TYPES.ownerReady
        : input.state === 'Degraded'
          ? CONTINUITY_AUDIT_EVENT_TYPES.ownerDegraded
          : CONTINUITY_AUDIT_EVENT_TYPES.ownerUnavailable;
    const outcome =
      input.state === 'Ready'
        ? 'Owner Ready'
        : input.state === 'Degraded'
          ? 'Owner Degraded'
          : 'Owner Unavailable';
    await this.audit.record({
      eventType,
      outcome,
      source: 'operational-continuity',
      attribution: {
        resourceType: 'analytical-owner',
        resourceId: input.owner,
      },
      payload: {
        owner: input.owner,
        state: input.state,
        ...(input.reason ? { reason: input.reason } : {}),
      },
    });
  }
}
