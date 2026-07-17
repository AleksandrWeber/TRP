import type { PipelineContext } from './pipeline-context';

/**
 * Fallback workspaceId used by Pipeline orchestrators/steps when no workspace
 * is supplied (US109). Keeps existing non-REST pipeline tests/callers working.
 */
export const DEFAULT_WORKSPACE_ID = 'default';

/**
 * Typed accessor for workspaceId on PipelineContext (US109).
 * Checks `input.workspaceId` first, then `metadata.workspaceId`, else defaults.
 */
export function readWorkspaceId(context: PipelineContext): string {
  const fromInput = context.input.workspaceId;
  if (typeof fromInput === 'string' && fromInput.trim() !== '') {
    return fromInput;
  }

  const fromMetadata = context.metadata.workspaceId;
  if (typeof fromMetadata === 'string' && fromMetadata.trim() !== '') {
    return fromMetadata;
  }

  return DEFAULT_WORKSPACE_ID;
}
