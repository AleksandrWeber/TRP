import { useCallback, useEffect, useState } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { api } from '../shared/api';
import {
  clearAccessToken,
  getActiveWorkspace,
  isAuthenticated,
  setActiveWorkspace,
} from '../shared/auth';
import { WorkspaceProvider } from './WorkspaceContext';

type GateStatus = 'loading' | 'ready' | 'auth-error' | 'offline';

function isNetworkError(error: unknown): boolean {
  const message = error instanceof Error ? error.message : String(error ?? '');
  return (
    message.includes('Cannot reach API') ||
    message.toLowerCase().includes('failed to fetch') ||
    message.toLowerCase().includes('networkerror')
  );
}

function isUnauthorizedError(error: unknown): boolean {
  const message = error instanceof Error ? error.message : String(error ?? '');
  return (
    message.includes('Unauthorized') ||
    message.includes('HTTP 401') ||
    message.includes('"statusCode":401') ||
    message.includes('statusCode":401')
  );
}

/**
 * Auth gate + workspace bootstrap (US002).
 * Ensures an active workspace is available after login and on page refresh.
 * Mounts the Workspace Context only after that existing bootstrap boundary is ready.
 *
 * Network outages must NOT clear the JWT — only real auth failures do.
 */
export function RequireAuth() {
  const authenticated = isAuthenticated();
  const [status, setStatus] = useState<GateStatus>(() =>
    authenticated && getActiveWorkspace() ? 'ready' : authenticated ? 'loading' : 'ready',
  );
  const [offlineMessage, setOfflineMessage] = useState<string | null>(null);

  const ensureWorkspace = useCallback(async () => {
    if (!isAuthenticated()) return;

    setStatus((current) => (current === 'ready' && getActiveWorkspace() ? current : 'loading'));
    setOfflineMessage(null);

    try {
      const workspace = await api.bootstrapWorkspace();
      setActiveWorkspace({ id: workspace.id, name: workspace.name });
      setStatus('ready');
    } catch (error) {
      if (isUnauthorizedError(error)) {
        clearAccessToken();
        setStatus('auth-error');
        return;
      }

      if (isNetworkError(error)) {
        // Keep session; allow retry when API comes back.
        if (getActiveWorkspace()) {
          setStatus('ready');
          return;
        }
        setOfflineMessage(
          error instanceof Error ? error.message : 'Cannot reach API. Start it, then retry.',
        );
        setStatus('offline');
        return;
      }

      // Non-auth API errors: keep going if we already have a cached workspace.
      if (getActiveWorkspace()) {
        setStatus('ready');
        return;
      }

      setOfflineMessage(error instanceof Error ? error.message : 'Workspace bootstrap failed');
      setStatus('offline');
    }
  }, []);

  useEffect(() => {
    if (!authenticated) return;

    let cancelled = false;

    void (async () => {
      await ensureWorkspace();
      if (cancelled) return;
    })();

    return () => {
      cancelled = true;
    };
  }, [authenticated, ensureWorkspace]);

  if (!authenticated || status === 'auth-error') {
    return <Navigate to="/login" replace />;
  }

  if (status === 'loading') {
    return (
      <div className="flex min-h-screen items-center justify-center text-sm text-slate-400">
        Preparing workspace…
      </div>
    );
  }

  if (status === 'offline') {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 px-6 text-center">
        <p className="text-sm text-slate-300">API is unreachable</p>
        <p className="max-w-md text-sm text-slate-500">
          {offlineMessage ?? 'Cannot reach the API. Start it with pnpm --filter @trp/api start'}
        </p>
        <button
          type="button"
          onClick={() => void ensureWorkspace()}
          className="rounded border border-white/15 px-4 py-2 text-sm text-slate-100 hover:bg-white/5 focus:outline focus:outline-2 focus:outline-offset-2 focus:outline-sky-400"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <WorkspaceProvider>
      <Outlet />
    </WorkspaceProvider>
  );
}
