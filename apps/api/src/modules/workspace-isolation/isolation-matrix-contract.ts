import {
  IsolationEvidenceType,
  IsolationMatrixExecutionStatus,
  type IsolationEvidenceRecord,
} from './isolation-evidence';

/**
 * Canonical Wave 1 isolation matrix rows (V3-S06-a harness).
 * Mirrors docs/project/version-3/wave-1-isolation-matrix.md and
 * v3-s06-implementation-package.md. The approved Product Owner Resolution
 * records only PASS / NOT APPLICABLE completeness without claiming S06 Close.
 */
export const IsolationMatrixRowId = {
  AuthenticationIdentityBinding: 'authentication-identity-binding',
  Session: 'session',
  RbacPeopleRoleAssignment: 'rbac-people-role-assignment',
  VaultSecrets: 'vault-secrets',
  SecurityAuditStore: 'security-audit-store',
  Timeline: 'timeline',
  IncidentInvestigation: 'incident-investigation',
  SecurityPlatformTenancy: 'security-platform-tenancy',
  WorkspaceMembershipBoundary: 'workspace-membership-boundary',
  ConnectionManagementBoundary: 'connection-management-boundary',
  Wave1EndpointInventory: 'wave-1-endpoint-inventory',
} as const;

export type IsolationMatrixRowId = (typeof IsolationMatrixRowId)[keyof typeof IsolationMatrixRowId];

export type IsolationMatrixRow = Readonly<{
  id: IsolationMatrixRowId;
  surface: string;
  owner: string;
  proofRequired: string;
  /** PASS or NOT APPLICABLE — never an undocumented third state. */
  executionStatus: IsolationMatrixExecutionStatus;
  /** Required for NOT APPLICABLE to keep its exclusion explicit. */
  statusReason?: string;
  /** Required for PASS: the boundary behavior that makes the claim valid. */
  passReason?: string;
  /** Required for PASS: the named A→B denial regression that proves the claim. */
  negativeRegression?: string;
  foundationEvidence?: IsolationEvidenceRecord;
}>;

export const WAVE1_ISOLATION_MATRIX: readonly IsolationMatrixRow[] = Object.freeze([
  {
    id: IsolationMatrixRowId.AuthenticationIdentityBinding,
    surface: 'Authentication / identity binding',
    owner: 'Auth',
    proofRequired:
      'A signed-in principal cannot act as another workspace operator; session resolution cannot leak cross-workspace subject binding.',
    executionStatus: IsolationMatrixExecutionStatus.Pass,
    passReason:
      'AuthSessionStore resolves a session only for its issued user, and JWT validation returns that same bound subject.',
    negativeRegression:
      'workspace-isolation.identity-coverage.spec.ts: foreign session cannot bind to operator A.',
    foundationEvidence: {
      types: [
        IsolationEvidenceType.Static,
        IsolationEvidenceType.Runtime,
        IsolationEvidenceType.Regression,
      ],
      proofStory:
        'AuthSessionStore binds session resolution to its issued user; session B cannot resolve as A.',
    },
  },
  {
    id: IsolationMatrixRowId.Session,
    surface: 'Session',
    owner: 'Auth',
    proofRequired: 'Workspace A session tokens never authorize reads or mutations in Workspace B.',
    executionStatus: IsolationMatrixExecutionStatus.Pass,
    passReason:
      'AuthSessionStore scopes live-session listing and revocation to the authenticated user.',
    negativeRegression:
      'workspace-isolation.identity-coverage.spec.ts: operator A cannot list or revoke operator B sessions.',
    foundationEvidence: {
      types: [
        IsolationEvidenceType.Static,
        IsolationEvidenceType.Runtime,
        IsolationEvidenceType.Regression,
      ],
      proofStory:
        'AuthSessionStore binds sessions to userId; list/revoke stay caller-scoped; foreign session denied.',
    },
  },
  {
    id: IsolationMatrixRowId.RbacPeopleRoleAssignment,
    surface: 'RBAC / People / role assignment',
    owner: 'Identity',
    proofRequired:
      'Identity-global People and role assignment never substitute for workspace membership; non-Admins cannot list or mutate People.',
    executionStatus: IsolationMatrixExecutionStatus.Pass,
    passReason:
      'People is the approved S02 Identity-global Admin projection; role assignment changes Identity role only and cannot create foreign workspace membership.',
    negativeRegression:
      'workspace-isolation.identity-coverage.spec.ts: an Admin role cannot grant Workspace A operator membership in Workspace B.',
    foundationEvidence: {
      types: [
        IsolationEvidenceType.Static,
        IsolationEvidenceType.Runtime,
        IsolationEvidenceType.Regression,
      ],
      proofStory:
        'Identity role assignment remains distinct from Workspace membership; a role grant cannot cross the workspace boundary.',
    },
  },
  {
    id: IsolationMatrixRowId.VaultSecrets,
    surface: 'Vault secrets',
    owner: 'Vault',
    proofRequired:
      'Workspace A cannot read, list, unwrap, or lifecycle-operate secrets owned by Workspace B.',
    executionStatus: IsolationMatrixExecutionStatus.Pass,
    passReason:
      'VaultAccessControl verifies workspace membership and C8 permission before every SecretVaultService operation; SecretVaultRepository slots are workspace-scoped.',
    negativeRegression:
      'workspace-isolation.vault-coverage.spec.ts: operator A cannot list, read, unwrap, store, replace, revoke, or delete Workspace B secrets.',
    foundationEvidence: {
      types: [
        IsolationEvidenceType.Static,
        IsolationEvidenceType.Runtime,
        IsolationEvidenceType.Regression,
      ],
      proofStory: 'VaultAccessControl denies Reader and foreign Trader.',
    },
  },
  {
    id: IsolationMatrixRowId.SecurityAuditStore,
    surface: 'Security Audit store',
    owner: 'Audit',
    proofRequired:
      'Workspace-attributed records from trusted emitters persist immutably and scoped timeline reads never return another workspace records.',
    executionStatus: IsolationMatrixExecutionStatus.Pass,
    passReason:
      'SecurityAuditService persists classified emitter attribution, while the Audit repository readTimeline query is explicitly scoped by workspaceId.',
    negativeRegression:
      'workspace-isolation.cross-product.spec.ts: Vault lifecycle records attributed to B never appear in A timeline, including with B cursor input.',
    foundationEvidence: {
      types: [
        IsolationEvidenceType.Static,
        IsolationEvidenceType.Runtime,
        IsolationEvidenceType.Regression,
      ],
      proofStory:
        'Vault lifecycle attribution is persisted by SecurityAuditService and readTimeline filters records by workspaceId.',
    },
  },
  {
    id: IsolationMatrixRowId.Timeline,
    surface: 'Timeline',
    owner: 'Audit',
    proofRequired:
      'Timeline for Workspace A never includes Workspace B events; cursor cannot hop tenants.',
    executionStatus: IsolationMatrixExecutionStatus.Pass,
    passReason:
      'SecurityAuditTimelineController verifies membership before read, and SecurityAuditTimelineService queries only the requested workspace timeline.',
    negativeRegression:
      'workspace-isolation.cross-product.spec.ts: A is denied before Timeline B read; B cursor input cannot return B facts from Timeline A.',
    foundationEvidence: {
      types: [
        IsolationEvidenceType.Static,
        IsolationEvidenceType.Runtime,
        IsolationEvidenceType.Regression,
      ],
      proofStory:
        'Timeline controller denies foreign workspace before read; scoped Vault lifecycle records remain isolated through Audit to Timeline.',
    },
  },
  {
    id: IsolationMatrixRowId.IncidentInvestigation,
    surface: 'Incident / investigation',
    owner: 'Audit',
    proofRequired:
      'Workspace-bound incidents refuse mixed evidence; internal investigation and export assemble only linked same-workspace events. No customer HTTP caller exists in Wave 1.',
    executionStatus: IsolationMatrixExecutionStatus.Pass,
    passReason:
      'Incident open and evidence attachment reject mixed-workspace evidence; investigation and export are internal-only foundations assembled from linked same-workspace events.',
    negativeRegression:
      'workspace-isolation.cross-product.spec.ts: an incident in Workspace A cannot link audit evidence from Workspace B.',
    foundationEvidence: {
      types: [
        IsolationEvidenceType.Static,
        IsolationEvidenceType.Runtime,
        IsolationEvidenceType.Regression,
      ],
      proofStory:
        'Incident workspace attribution and evidence-link validation refuse cross-workspace audit evidence; no customer HTTP investigation/export route exists.',
    },
  },
  {
    id: IsolationMatrixRowId.SecurityPlatformTenancy,
    surface: 'Security Platform tenancy',
    owner: 'Platform',
    proofRequired: 'Not applicable: Platform owns hardening, not workspace-scoped tenant state.',
    executionStatus: IsolationMatrixExecutionStatus.NotApplicable,
    statusReason:
      'Security Platform has no tenant-state source of truth. Workspace isolation is owned and proved by Authentication, Session, Vault, Audit, Timeline, and Workspace membership; V3-S04 Close remains Platform evidence.',
  },
  {
    id: IsolationMatrixRowId.WorkspaceMembershipBoundary,
    surface: 'Workspace membership / boundary',
    owner: 'Workspace / Identity',
    proofRequired:
      'Membership is the gate; non-members get honest deny; foreign workspace id substitution fails closed.',
    executionStatus: IsolationMatrixExecutionStatus.Pass,
    passReason:
      'WorkspaceAccessService checks membership before resolving or authorizing a caller-supplied workspace ID.',
    negativeRegression:
      'workspace-isolation.negative-proofs.spec.ts: Workspace A operator is denied after substituting Workspace B ID.',
    foundationEvidence: {
      types: [
        IsolationEvidenceType.Static,
        IsolationEvidenceType.Runtime,
        IsolationEvidenceType.Regression,
      ],
      proofStory: 'WorkspaceAccessService isMember / resolveAccessibleWorkspaceId / assertMember.',
    },
  },
  {
    id: IsolationMatrixRowId.ConnectionManagementBoundary,
    surface: 'Future Connection Management boundary',
    owner: 'Wave 2 (boundary verified in S06)',
    proofRequired:
      'Connections not available as product; no path reads foreign workspace credentials early.',
    executionStatus: IsolationMatrixExecutionStatus.NotApplicable,
    statusReason:
      'Connection Management is explicitly Wave 2 and no product route or credential store exists in Wave 1.',
  },
  {
    id: IsolationMatrixRowId.Wave1EndpointInventory,
    surface: 'Wave 1 security route ownership inventory',
    owner: 'Owning package of endpoint',
    proofRequired:
      'Every Wave 1 security-relevant route maps to an owning bounded context and a PASS or NOT APPLICABLE isolation row.',
    executionStatus: IsolationMatrixExecutionStatus.Pass,
    passReason:
      'wave-1-security-route-ownership-inventory.md maps every Wave 1 security-relevant route to its owner and matrix row; no route is orphaned.',
    negativeRegression:
      'Documentation consistency check: wave-1-security-route-ownership-inventory.md has no orphan security route and only PASS or NOT APPLICABLE statuses.',
    foundationEvidence: {
      types: [
        IsolationEvidenceType.Static,
        IsolationEvidenceType.Runtime,
        IsolationEvidenceType.Regression,
      ],
      proofStory:
        'The Close inventory maps every Wave 1 security-relevant HTTP route to an existing security owner and its PASS or NOT APPLICABLE matrix row.',
    },
  },
]);

export function matrixRow(id: IsolationMatrixRowId): IsolationMatrixRow {
  const row = WAVE1_ISOLATION_MATRIX.find((entry) => entry.id === id);
  if (!row) throw new Error(`Unknown isolation matrix row: ${id}`);
  return row;
}

export function matrixRowIds(): readonly IsolationMatrixRowId[] {
  return WAVE1_ISOLATION_MATRIX.map((row) => row.id);
}
