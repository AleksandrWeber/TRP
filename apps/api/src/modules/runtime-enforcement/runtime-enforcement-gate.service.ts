/**
 * RC-23 Epic 3 — Runtime Enforcement Gate Nest adapter.
 *
 * Implements RuntimeEnforcementPort.validateDeployment.
 * No Session/Deployment product hooks. No Library writes.
 */

import { Inject, Injectable } from '@nestjs/common';
import type {
  EnforcementDecision,
  RuntimeEnforcementPort,
  ValidateDeploymentRequest,
} from './ports/runtime-enforcement.port';
import { validateDeployment } from './domain/validate-deployment';
import { RuntimeEnforcementLibraryReadService } from './runtime-enforcement-library-read.service';

@Injectable()
export class RuntimeEnforcementGateService implements RuntimeEnforcementPort {
  constructor(
    @Inject(RuntimeEnforcementLibraryReadService)
    private readonly libraryReads: RuntimeEnforcementLibraryReadService,
  ) {}

  validateDeployment(cmd: ValidateDeploymentRequest): EnforcementDecision {
    const reads = this.libraryReads;
    return validateDeployment(cmd, {
      getByLibraryEntryId: (id) => reads.getByLibraryEntryId(id),
      getByFamilyVersion: (familyId, version) => reads.getByFamilyVersion(familyId, version),
      familyExistsInWorkspace: (workspaceId, strategyFamilyId) =>
        reads.familyExistsInWorkspace(workspaceId, strategyFamilyId),
    });
  }
}
