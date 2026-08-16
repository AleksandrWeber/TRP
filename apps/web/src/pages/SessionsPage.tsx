import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api, type SignInSessionView } from '../shared/api';
import { clearAccessToken } from '../shared/auth';
import { toUserFacingError } from '../shared/mapApiError';
import { ErrorBanner, LoadingState, PageHeader, SuccessBanner } from '../shared/product-ui';
import {
  CURRENT_SESSION_LABEL,
  REVOKE_ALL_PROMPT,
  REVOKE_ONE_PROMPT,
  REVOKE_OTHERS_EMPTY,
  REVOKE_OTHERS_PROMPT,
  REVOKE_OTHERS_SUCCESS,
  REVOKE_ONE_SUCCESS,
  SESSIONS_ACTION_ERROR,
  SESSIONS_LOAD_ERROR,
  SESSIONS_LOCATION_NOTE,
  SESSIONS_PAGE_DESCRIPTION,
  SESSIONS_PAGE_TITLE,
  formatSessionTime,
  networkLabel,
  otherSessions,
  type SessionPendingAction,
} from './sessionManagement';

export function SessionsPage() {
  const navigate = useNavigate();
  const [sessions, setSessions] = useState<SignInSessionView[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [pending, setPending] = useState<SessionPendingAction | null>(null);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const result = await api.listSignInSessions();
      setSessions(result.sessions);
    } catch (err) {
      setError(toUserFacingError(err, SESSIONS_LOAD_ERROR));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  function leaveSignedOut() {
    clearAccessToken();
    navigate('/login');
  }

  async function runPending() {
    if (!pending) return;
    setBusy(true);
    setError(null);
    setSuccess(null);
    try {
      if (pending.kind === 'revoke-one') {
        const result = await api.revokeSignInSession(pending.sessionId);
        if (result.endedCurrent) {
          leaveSignedOut();
          return;
        }
        setSuccess(REVOKE_ONE_SUCCESS);
      } else if (pending.kind === 'revoke-others') {
        const result = await api.revokeOtherSignInSessions();
        setSuccess(result.revokedCount > 0 ? REVOKE_OTHERS_SUCCESS : REVOKE_OTHERS_EMPTY);
      } else {
        await api.revokeAllSignInSessions();
        leaveSignedOut();
        return;
      }
      setPending(null);
      await load();
    } catch (err) {
      setError(toUserFacingError(err, SESSIONS_ACTION_ERROR));
    } finally {
      setBusy(false);
    }
  }

  return (
    <SessionsPanel
      sessions={sessions}
      loading={loading}
      busy={busy}
      error={error}
      success={success}
      pending={pending}
      onAsk={setPending}
      onCancel={() => setPending(null)}
      onConfirm={() => void runPending()}
    />
  );
}

export function SessionsPanel({
  sessions,
  loading,
  busy,
  error,
  success,
  pending,
  onAsk,
  onCancel,
  onConfirm,
}: {
  sessions: readonly SignInSessionView[];
  loading: boolean;
  busy: boolean;
  error: string | null;
  success: string | null;
  pending: SessionPendingAction | null;
  onAsk: (pending: SessionPendingAction) => void;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  const others = otherSessions(sessions);

  return (
    <div className="space-y-6">
      <PageHeader
        productId="sign-in-sessions"
        title={SESSIONS_PAGE_TITLE}
        description={SESSIONS_PAGE_DESCRIPTION}
      />
      <p className="text-sm text-slate-500">{SESSIONS_LOCATION_NOTE}</p>
      <ErrorBanner message={error} />
      <SuccessBanner message={success} />
      {loading ? <LoadingState label="Loading sign-in sessions…" /> : null}
      {!loading ? (
        <ul className="space-y-3">
          {sessions.map((session) => (
            <li
              key={session.id}
              className="rounded-lg border border-white/10 bg-white/5 px-4 py-3"
              data-testid={session.current ? 'current-session' : `session-${session.id}`}
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="font-medium text-slate-100">
                    {session.device} · {session.browser}
                  </p>
                  {session.current ? (
                    <p className="mt-1 text-xs uppercase tracking-wide text-sky-300">
                      {CURRENT_SESSION_LABEL}
                    </p>
                  ) : null}
                  <p className="mt-2 text-sm text-slate-400">{networkLabel(session.network)}</p>
                  <p className="mt-1 text-sm text-slate-500">
                    Signed in {formatSessionTime(session.signedInAt)}
                  </p>
                  <p className="text-sm text-slate-500">
                    Last active {formatSessionTime(session.lastActiveAt)}
                  </p>
                </div>
                {!session.current ? (
                  pending?.kind === 'revoke-one' && pending.sessionId === session.id ? (
                    <ConfirmActions
                      prompt={REVOKE_ONE_PROMPT}
                      confirmLabel="End this sign-in"
                      busy={busy}
                      onCancel={onCancel}
                      onConfirm={onConfirm}
                    />
                  ) : (
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => onAsk({ kind: 'revoke-one', sessionId: session.id })}
                      className="rounded-lg border border-red-500/40 px-3 py-1.5 text-sm text-red-200 hover:bg-red-500/10 focus:outline focus:outline-2 focus:outline-offset-2 focus:outline-sky-400 disabled:opacity-50"
                    >
                      End this sign-in
                    </button>
                  )
                ) : null}
              </div>
            </li>
          ))}
        </ul>
      ) : null}

      {!loading ? (
        <div className="space-y-3 rounded-lg border border-white/10 px-4 py-4">
          <p className="text-sm font-medium text-slate-200">End other sign-ins</p>
          {pending?.kind === 'revoke-others' ? (
            <ConfirmActions
              prompt={REVOKE_OTHERS_PROMPT}
              confirmLabel="End other sign-ins"
              busy={busy}
              onCancel={onCancel}
              onConfirm={onConfirm}
            />
          ) : (
            <button
              type="button"
              disabled={busy || others.length === 0}
              onClick={() => onAsk({ kind: 'revoke-others' })}
              className="rounded-lg border border-white/20 px-3 py-2 text-sm text-slate-200 hover:bg-white/5 focus:outline focus:outline-2 focus:outline-offset-2 focus:outline-sky-400 disabled:opacity-50"
            >
              End all other sign-ins
            </button>
          )}
          <p className="text-sm font-medium text-slate-200">Sign out everywhere</p>
          {pending?.kind === 'revoke-all' ? (
            <ConfirmActions
              prompt={REVOKE_ALL_PROMPT}
              confirmLabel="Sign out everywhere"
              busy={busy}
              onCancel={onCancel}
              onConfirm={onConfirm}
            />
          ) : (
            <button
              type="button"
              disabled={busy}
              onClick={() => onAsk({ kind: 'revoke-all' })}
              className="rounded-lg border border-red-500/40 px-3 py-2 text-sm text-red-200 hover:bg-red-500/10 focus:outline focus:outline-2 focus:outline-offset-2 focus:outline-sky-400 disabled:opacity-50"
            >
              Sign out everywhere
            </button>
          )}
        </div>
      ) : null}
    </div>
  );
}

function ConfirmActions({
  prompt,
  confirmLabel,
  busy,
  onCancel,
  onConfirm,
}: {
  prompt: string;
  confirmLabel: string;
  busy: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  return (
    <div className="max-w-sm space-y-2">
      <p role="status" className="text-sm text-slate-300">
        {prompt}
      </p>
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          disabled={busy}
          onClick={onConfirm}
          className="rounded-lg bg-white px-3 py-1.5 text-sm font-medium text-black disabled:opacity-50"
        >
          {busy ? 'Working…' : confirmLabel}
        </button>
        <button
          type="button"
          disabled={busy}
          onClick={onCancel}
          className="rounded-lg px-3 py-1.5 text-sm text-slate-400 hover:text-white disabled:opacity-50"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
