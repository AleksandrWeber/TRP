const TOKEN_KEY = 'trp_access_token';
const WORKSPACE_KEY = 'trp_active_workspace';

export type ActiveWorkspace = {
  id: string;
  name: string;
};

export type ActiveWorkspaceListener = (workspace: ActiveWorkspace | null) => void;

const activeWorkspaceListeners = new Set<ActiveWorkspaceListener>();

function notifyActiveWorkspaceListeners(workspace: ActiveWorkspace | null) {
  activeWorkspaceListeners.forEach((listener) => listener(workspace));
}

export function getAccessToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function setAccessToken(token: string) {
  localStorage.setItem(TOKEN_KEY, token);
}

export function clearAccessToken() {
  localStorage.removeItem(TOKEN_KEY);
  clearActiveWorkspace();
}

export function isAuthenticated(): boolean {
  return Boolean(getAccessToken());
}

export function getActiveWorkspace(): ActiveWorkspace | null {
  const raw = localStorage.getItem(WORKSPACE_KEY);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as Partial<ActiveWorkspace>;
    if (typeof parsed.id === 'string' && typeof parsed.name === 'string') {
      return { id: parsed.id, name: parsed.name };
    }
  } catch {
    // ignore corrupt storage
  }
  return null;
}

export function setActiveWorkspace(workspace: ActiveWorkspace) {
  localStorage.setItem(WORKSPACE_KEY, JSON.stringify(workspace));
  notifyActiveWorkspaceListeners(workspace);
}

export function clearActiveWorkspace() {
  localStorage.removeItem(WORKSPACE_KEY);
  notifyActiveWorkspaceListeners(null);
}

export function subscribeToActiveWorkspace(listener: ActiveWorkspaceListener) {
  activeWorkspaceListeners.add(listener);
  return () => {
    activeWorkspaceListeners.delete(listener);
  };
}
