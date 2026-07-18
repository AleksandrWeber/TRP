const TOKEN_KEY = 'trp_access_token';
const WORKSPACE_KEY = 'trp_active_workspace';

export type ActiveWorkspace = {
  id: string;
  name: string;
};

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
}

export function clearActiveWorkspace() {
  localStorage.removeItem(WORKSPACE_KEY);
}
