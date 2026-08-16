const LEGACY_TOKEN_KEY = 'trp_access_token';
const SIGNED_IN_KEY = 'trp_signed_in';
const WORKSPACE_KEY = 'trp_active_workspace';

export type ActiveWorkspace = {
  id: string;
  name: string;
};

export type ActiveWorkspaceListener = (workspace: ActiveWorkspace | null) => void;

const activeWorkspaceListeners = new Set<ActiveWorkspaceListener>();

let memoryAccessToken: string | null = null;
let memoryCsrfToken: string | null = null;

function notifyActiveWorkspaceListeners(workspace: ActiveWorkspace | null) {
  activeWorkspaceListeners.forEach((listener) => listener(workspace));
}

function dropLegacyAccessToken() {
  if (typeof localStorage === 'undefined') return;
  localStorage.removeItem(LEGACY_TOKEN_KEY);
}

export function getAccessToken(): string | null {
  return memoryAccessToken;
}

export function getCsrfToken(): string | null {
  return memoryCsrfToken;
}

export function setCsrfToken(token: string) {
  memoryCsrfToken = token;
}

export function setAccessToken(token: string, csrfToken?: string) {
  memoryAccessToken = token;
  if (csrfToken) {
    memoryCsrfToken = csrfToken;
  }
  if (typeof localStorage !== 'undefined') {
    localStorage.setItem(SIGNED_IN_KEY, '1');
    dropLegacyAccessToken();
  }
}

export function clearAccessToken() {
  memoryAccessToken = null;
  memoryCsrfToken = null;
  if (typeof localStorage !== 'undefined') {
    localStorage.removeItem(SIGNED_IN_KEY);
    dropLegacyAccessToken();
  }
  clearActiveWorkspace();
}

export function isAuthenticated(): boolean {
  if (memoryAccessToken) return true;
  if (typeof localStorage === 'undefined') return false;
  return localStorage.getItem(SIGNED_IN_KEY) === '1';
}

export function getActiveWorkspace(): ActiveWorkspace | null {
  if (typeof localStorage === 'undefined') return null;
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
  if (typeof localStorage === 'undefined') return;
  localStorage.removeItem(WORKSPACE_KEY);
  notifyActiveWorkspaceListeners(null);
}

export function subscribeToActiveWorkspace(listener: ActiveWorkspaceListener) {
  activeWorkspaceListeners.add(listener);
  return () => {
    activeWorkspaceListeners.delete(listener);
  };
}
