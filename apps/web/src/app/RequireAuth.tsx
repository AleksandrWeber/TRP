import { useEffect, useState } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { api } from '../shared/api';
import {
  clearAccessToken,
  getActiveWorkspace,
  isAuthenticated,
  setActiveWorkspace,
} from '../shared/auth';

/**
 * Auth gate + workspace bootstrap (US002).
 * Ensures an active workspace is available after login and on page refresh.
 * Does not propagate X-Workspace-Id into API calls yet.
 */
export function RequireAuth() {
  const authenticated = isAuthenticated();
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>(() =>
    authenticated && getActiveWorkspace() ? 'ready' : authenticated ? 'loading' : 'ready',
  );

  useEffect(() => {
    if (!authenticated) return;

    let cancelled = false;

    async function ensureWorkspace() {
      try {
        const workspace = await api.bootstrapWorkspace();
        if (cancelled) return;
        setActiveWorkspace({ id: workspace.id, name: workspace.name });
        setStatus('ready');
      } catch {
        if (cancelled) return;
        clearAccessToken();
        setStatus('error');
      }
    }

    void ensureWorkspace();

    return () => {
      cancelled = true;
    };
  }, [authenticated]);

  if (!authenticated || status === 'error') {
    return <Navigate to="/login" replace />;
  }

  if (status === 'loading') {
    return (
      <div className="flex min-h-screen items-center justify-center text-sm text-slate-400">
        Preparing workspace…
      </div>
    );
  }

  return <Outlet />;
}
