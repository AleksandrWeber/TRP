export const WORKSPACE_NAME_MAX_LENGTH = 80;

export function validateWorkspaceName(name: string): string | null {
  const trimmed = name.trim();
  if (!trimmed) return 'Enter a workspace name.';
  if (trimmed.length > WORKSPACE_NAME_MAX_LENGTH) {
    return `Workspace name must be ${WORKSPACE_NAME_MAX_LENGTH} characters or fewer.`;
  }
  return null;
}
