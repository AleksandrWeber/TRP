/**
 * RC-25 Epic 4 — derive stable qualification identities (deterministic; no crypto).
 */

export function deriveQualificationTargetId(
  workspaceId: string,
  exchangeScopeId: string,
  marketSymbol: string,
): string {
  return `qual-tgt:${workspaceId}:${exchangeScopeId}:${marketSymbol}`;
}

export function deriveQualificationRunId(parts: readonly string[]): string {
  return `qual-run:${parts.map((p) => p.trim() || '_').join(':')}`;
}
