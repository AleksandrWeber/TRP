import { describe, expect, it } from 'vitest';
import { createDualWorkspaceIsolationFixture } from './dual-workspace.fixture';
import { IsolationEvidenceType, IsolationMatrixExecutionStatus } from './isolation-evidence';
import {
  IsolationMatrixRowId,
  WAVE1_ISOLATION_MATRIX,
  matrixRow,
  matrixRowIds,
} from './isolation-matrix-contract';
import { expectForeignWorkspaceDenied, ISOLATION_PROOF_STORY } from './negative-proof';

describe('Workspace isolation matrix contract (V3-S06-b)', () => {
  it('lists every Wave 1 matrix row with a Product Owner-visible completeness state', () => {
    expect(matrixRowIds()).toHaveLength(WAVE1_ISOLATION_MATRIX.length);
    expect(matrixRowIds()).toEqual(
      expect.arrayContaining([
        IsolationMatrixRowId.AuthenticationIdentityBinding,
        IsolationMatrixRowId.Session,
        IsolationMatrixRowId.RbacPeopleRoleAssignment,
        IsolationMatrixRowId.VaultSecrets,
        IsolationMatrixRowId.SecurityAuditStore,
        IsolationMatrixRowId.Timeline,
        IsolationMatrixRowId.IncidentInvestigation,
        IsolationMatrixRowId.SecurityPlatformTenancy,
        IsolationMatrixRowId.WorkspaceMembershipBoundary,
        IsolationMatrixRowId.ConnectionManagementBoundary,
        IsolationMatrixRowId.Wave1EndpointInventory,
      ]),
    );

    for (const row of WAVE1_ISOLATION_MATRIX) {
      expect(Object.values(IsolationMatrixExecutionStatus)).toContain(row.executionStatus);
      expect(row.surface.trim()).not.toBe('');
      expect(row.owner.trim()).not.toBe('');
      expect(row.proofRequired.trim()).not.toBe('');
      if (row.executionStatus === IsolationMatrixExecutionStatus.NotApplicable) {
        expect(row.statusReason?.trim()).not.toBe('');
      }
      if (row.executionStatus === IsolationMatrixExecutionStatus.Pass) {
        expect(row.passReason?.trim()).not.toBe('');
        expect(row.foundationEvidence?.types).toEqual(
          expect.arrayContaining([
            IsolationEvidenceType.Static,
            IsolationEvidenceType.Runtime,
            IsolationEvidenceType.Regression,
          ]),
        );
        expect(row.negativeRegression?.trim()).not.toBe('');
      }
    }
  });

  it('records the standard isolation proof story', () => {
    expect(ISOLATION_PROOF_STORY).toEqual([
      'Workspace A',
      'attempt',
      'Workspace B',
      'Denied',
      'Regression test',
    ]);
  });

  it('smoke-tests dual-workspace fixtures: A member of A only, B id denied for A', async () => {
    const fixture = await createDualWorkspaceIsolationFixture();

    expect(fixture.access.isMember(fixture.workspaceA.id, fixture.operatorAId)).toBe(true);
    expect(fixture.access.isMember(fixture.workspaceB.id, fixture.operatorAId)).toBe(false);
    expectForeignWorkspaceDenied(
      fixture.access.resolveAccessibleWorkspaceId(fixture.workspaceB.id, fixture.operatorAId),
      fixture.workspaceB.id,
    );
    expect(() => fixture.access.assertMember(fixture.workspaceB.id, fixture.operatorAId)).toThrow(
      'workspace access denied',
    );
  });

  it('records proof-complete PASS rows and an explicit reason for NOT APPLICABLE rows', () => {
    const evidenced = WAVE1_ISOLATION_MATRIX.filter(
      (row) => row.foundationEvidence !== undefined,
    ).map((row) => row.id);

    expect(evidenced).toEqual(
      expect.arrayContaining([
        IsolationMatrixRowId.WorkspaceMembershipBoundary,
        IsolationMatrixRowId.VaultSecrets,
        IsolationMatrixRowId.Timeline,
        IsolationMatrixRowId.IncidentInvestigation,
        IsolationMatrixRowId.RbacPeopleRoleAssignment,
        IsolationMatrixRowId.Wave1EndpointInventory,
        IsolationMatrixRowId.AuthenticationIdentityBinding,
        IsolationMatrixRowId.Session,
        IsolationMatrixRowId.SecurityAuditStore,
      ]),
    );
    expect(
      WAVE1_ISOLATION_MATRIX.filter(
        (row) => row.executionStatus === IsolationMatrixExecutionStatus.Pass,
      ).map((row) => row.id),
    ).toEqual(
      expect.arrayContaining([
        IsolationMatrixRowId.AuthenticationIdentityBinding,
        IsolationMatrixRowId.Session,
        IsolationMatrixRowId.RbacPeopleRoleAssignment,
        IsolationMatrixRowId.VaultSecrets,
        IsolationMatrixRowId.SecurityAuditStore,
        IsolationMatrixRowId.Timeline,
        IsolationMatrixRowId.IncidentInvestigation,
        IsolationMatrixRowId.WorkspaceMembershipBoundary,
        IsolationMatrixRowId.Wave1EndpointInventory,
      ]),
    );
    expect(matrixRow(IsolationMatrixRowId.ConnectionManagementBoundary).executionStatus).toBe(
      IsolationMatrixExecutionStatus.NotApplicable,
    );
    expect(matrixRow(IsolationMatrixRowId.ConnectionManagementBoundary).statusReason).toMatch(
      /Wave 2/,
    );
    expect(matrixRow(IsolationMatrixRowId.SecurityPlatformTenancy).executionStatus).toBe(
      IsolationMatrixExecutionStatus.NotApplicable,
    );
    expect(matrixRow(IsolationMatrixRowId.SecurityPlatformTenancy).statusReason).toMatch(
      /no tenant-state/i,
    );
  });
});
