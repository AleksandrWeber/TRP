/**
 * PC-04 — product adapter over RuntimeEnforcementPort.validateDeployment.
 *
 * Delegates PASS/FAIL to the existing Gate. Records a read-only history entry.
 * Does not redesign Enforcement. Does not bind Deployment. Does not start Session.
 */

import { randomUUID } from 'node:crypto';
import { Inject, Injectable } from '@nestjs/common';
import type {
  EnforcementDecision,
  RuntimeEnforcementPort,
  ValidateDeploymentRequest,
} from './ports/runtime-enforcement.port';
import { RUNTIME_ENFORCEMENT_PORT } from './ports/runtime-enforcement.port';
import { InMemoryRuntimeValidationStore } from './in-memory-runtime-validation.store';
import { RuntimeEnforcementLibraryReadService } from './runtime-enforcement-library-read.service';
import type {
  RuntimeValidationHistoryPage,
  RuntimeValidationHistoryQuery,
  RuntimeValidationRecord,
} from './runtime-validation.record';

@Injectable()
export class RuntimeValidationService {
  constructor(
    @Inject(RUNTIME_ENFORCEMENT_PORT)
    private readonly gate: RuntimeEnforcementPort,
    private readonly libraryReads: RuntimeEnforcementLibraryReadService,
    private readonly store: InMemoryRuntimeValidationStore,
  ) {}

  run(cmd: ValidateDeploymentRequest): RuntimeValidationRecord {
    const createdAt = new Date().toISOString();
    const decision = this.gate.validateDeployment(cmd);
    const record = freezeRecord({
      validationId: `val-${randomUUID()}`,
      workspaceId: cmd.workspaceId?.trim() ?? '',
      progress: 'complete',
      outcome: decision.outcome,
      validation: decision.validation,
      reasons: decision.reasons,
      libraryEntryId: decision.libraryEntryId ?? cmd.libraryEntryId?.trim() ?? null,
      purpose: cmd.purpose,
      exchangeScopeId: cmd.exchangeScopeId?.trim() || null,
      certificationStatus: decision.certificationStatus ?? null,
      eligibilityOutcome: decision.eligibilityOutcome ?? null,
      checkedAt: decision.checkedAt,
      createdAt,
      ...snapshotIdentity(cmd, decision, this.libraryReads),
    });
    return this.store.append(record);
  }

  get(validationId: string, workspaceId: string): RuntimeValidationRecord | null {
    return this.store.get(validationId, workspaceId);
  }

  listHistory(query: RuntimeValidationHistoryQuery): RuntimeValidationHistoryPage {
    return this.store.list(query);
  }
}

function snapshotIdentity(
  cmd: ValidateDeploymentRequest,
  decision: EnforcementDecision,
  reads: RuntimeEnforcementLibraryReadService,
): Pick<RuntimeValidationRecord, 'strategyFamilyId' | 'strategyVersion' | 'strategyName'> {
  const libraryEntryId = decision.libraryEntryId ?? cmd.libraryEntryId?.trim();
  const fromEntry = libraryEntryId ? reads.getByLibraryEntryId(libraryEntryId) : null;
  const familyId = cmd.strategyFamilyId?.trim();
  const version = cmd.strategyVersion?.trim();
  const fromFamily =
    !fromEntry && familyId && version ? reads.getByFamilyVersion(familyId, version) : null;
  const record = fromEntry ?? fromFamily;
  return {
    strategyFamilyId: record?.strategy.strategyFamilyId ?? familyId ?? null,
    strategyVersion: record?.version.version ?? version ?? null,
    strategyName: record?.strategy.name ?? null,
  };
}

function freezeRecord(record: RuntimeValidationRecord): RuntimeValidationRecord {
  return Object.freeze({
    ...record,
    reasons: Object.freeze([...record.reasons]),
  });
}
