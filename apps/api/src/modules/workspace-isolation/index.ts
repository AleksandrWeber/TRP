export {
  IsolationEvidenceType,
  IsolationMatrixExecutionStatus,
  type IsolationEvidenceRecord,
} from './isolation-evidence';
export {
  IsolationMatrixRowId,
  WAVE1_ISOLATION_MATRIX,
  matrixRow,
  matrixRowIds,
  type IsolationMatrixRow,
} from './isolation-matrix-contract';
export {
  createDualWorkspaceIsolationFixture,
  type DualWorkspaceIsolationFixture,
} from './dual-workspace.fixture';
export {
  expectForeignWorkspaceDenied,
  expectNoForeignPayload,
  ISOLATION_PROOF_STORY,
} from './negative-proof';
