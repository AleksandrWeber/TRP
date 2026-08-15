export type StoredWorkspace = {
  id: string;
  name: string;
};

export type WorkspaceRecord = StoredWorkspace & {
  status: string;
};

/**
 * Restore the persisted active workspace when it is still owned and Active.
 * Otherwise fall back to existing bootstrap (earliest active, or create default).
 * Network and unauthorized failures are rethrown for the auth gate.
 */
export async function resolveActiveWorkspace(input: {
  stored: StoredWorkspace | null;
  getWorkspace: (id: string) => Promise<WorkspaceRecord>;
  bootstrap: () => Promise<StoredWorkspace>;
}): Promise<StoredWorkspace> {
  if (input.stored) {
    try {
      const current = await input.getWorkspace(input.stored.id);
      if (current.status === 'Active') {
        return { id: current.id, name: current.name };
      }
    } catch (error) {
      if (isNetworkError(error) || isUnauthorizedError(error)) {
        throw error;
      }
    }
  }

  const workspace = await input.bootstrap();
  return { id: workspace.id, name: workspace.name };
}

export function isNetworkError(error: unknown): boolean {
  const message = error instanceof Error ? error.message : String(error ?? '');
  return (
    message.includes('Cannot reach API') ||
    message.toLowerCase().includes('failed to fetch') ||
    message.toLowerCase().includes('networkerror')
  );
}

export function isUnauthorizedError(error: unknown): boolean {
  const message = error instanceof Error ? error.message : String(error ?? '');
  return (
    message.includes('Unauthorized') ||
    message.includes('HTTP 401') ||
    message.includes('"statusCode":401') ||
    message.includes('statusCode":401')
  );
}
