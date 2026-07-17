/**
 * Branded workspace identity (US108).
 * Opaque string — not interchangeable with other entity ids at the type level.
 */
export type WorkspaceId = string & { readonly __brand: 'WorkspaceId' };

export function toWorkspaceId(value: string): WorkspaceId {
  return value as WorkspaceId;
}
