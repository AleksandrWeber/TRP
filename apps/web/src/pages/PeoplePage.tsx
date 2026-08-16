import { useEffect, useMemo, useState } from 'react';
import { api, type PeopleOperatorView } from '../shared/api';
import { toUserFacingError } from '../shared/mapApiError';
import { ErrorBanner, LoadingState, PageHeader, SuccessBanner } from '../shared/product-ui';
import {
  LAST_ADMIN_MESSAGE,
  PEOPLE_ACTION_ERROR,
  PEOPLE_CHANGE_LABEL,
  PEOPLE_CONFIRM_LABEL,
  PEOPLE_FORBIDDEN,
  PEOPLE_FORBIDDEN_TITLE,
  PEOPLE_LOAD_ERROR,
  PEOPLE_OWN_ROLE_NOTE,
  PEOPLE_PAGE_DESCRIPTION,
  PEOPLE_PAGE_TITLE,
  PEOPLE_ROLES,
  PEOPLE_SUCCESS,
  PEOPLE_YOU_LABEL,
  confirmRoleChangePrompt,
  isCurrentOperator,
  isPeopleRole,
  roleLabel,
  type PeopleRole,
} from './peopleProduct';

export function PeoplePage() {
  const [operators, setOperators] = useState<PeopleOperatorView[]>([]);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [forbidden, setForbidden] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [pending, setPending] = useState<{ userId: string; role: PeopleRole } | null>(null);
  const [drafts, setDrafts] = useState<Record<string, string>>({});

  async function load() {
    setLoading(true);
    setError(null);
    setForbidden(false);
    try {
      const [me, listed] = await Promise.all([api.me(), api.listPeople()]);
      setCurrentUserId(me.id);
      setOperators(listed.operators);
      setDrafts(
        Object.fromEntries(listed.operators.map((operator) => [operator.id, operator.role])),
      );
    } catch (err) {
      if (isForbiddenError(err)) {
        setForbidden(true);
        setOperators([]);
        return;
      }
      setError(toUserFacingError(err, PEOPLE_LOAD_ERROR));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  async function confirmChange() {
    if (!pending) return;
    setBusy(true);
    setError(null);
    setSuccess(null);
    try {
      const updated = await api.assignPersonRole(pending.userId, pending.role);
      setOperators((current) =>
        current.map((operator) => (operator.id === updated.id ? updated : operator)),
      );
      setDrafts((current) => ({ ...current, [updated.id]: updated.role }));
      setSuccess(PEOPLE_SUCCESS);
      setPending(null);
    } catch (err) {
      setError(toUserFacingError(err, PEOPLE_ACTION_ERROR));
    } finally {
      setBusy(false);
    }
  }

  return (
    <PeoplePanel
      operators={operators}
      currentUserId={currentUserId}
      loading={loading}
      forbidden={forbidden}
      busy={busy}
      error={error}
      success={success}
      pending={pending}
      drafts={drafts}
      onDraft={(userId, role) => setDrafts((current) => ({ ...current, [userId]: role }))}
      onAsk={(userId, role) => {
        setPending({ userId, role });
        setError(null);
        setSuccess(null);
      }}
      onCancel={() => setPending(null)}
      onConfirm={() => void confirmChange()}
    />
  );
}

export function PeoplePanel({
  operators,
  currentUserId,
  loading,
  forbidden,
  busy,
  error,
  success,
  pending,
  drafts,
  onDraft,
  onAsk,
  onCancel,
  onConfirm,
}: {
  operators: readonly PeopleOperatorView[];
  currentUserId: string | null;
  loading: boolean;
  forbidden: boolean;
  busy: boolean;
  error: string | null;
  success: string | null;
  pending: { userId: string; role: PeopleRole } | null;
  drafts: Record<string, string>;
  onDraft: (userId: string, role: string) => void;
  onAsk: (userId: string, role: PeopleRole) => void;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  const pendingOperator = useMemo(
    () => operators.find((operator) => operator.id === pending?.userId) ?? null,
    [operators, pending],
  );

  return (
    <div className="space-y-6">
      <PageHeader
        productId="people"
        title={PEOPLE_PAGE_TITLE}
        description={PEOPLE_PAGE_DESCRIPTION}
      />
      {forbidden ? (
        <div
          className="rounded-lg border border-white/15 px-6 py-8"
          data-testid="people-forbidden"
          role="status"
        >
          <h2 className="text-base font-medium text-slate-200">{PEOPLE_FORBIDDEN_TITLE}</h2>
          <p className="mt-2 text-sm text-slate-400">{PEOPLE_FORBIDDEN}</p>
        </div>
      ) : null}
      {!forbidden ? <ErrorBanner message={error} /> : null}
      {!forbidden ? <SuccessBanner message={success} /> : null}
      {loading ? <LoadingState label="Loading people…" /> : null}
      {!loading && !forbidden ? (
        <ul className="space-y-3">
          {operators.map((operator) => {
            const self = isCurrentOperator(operator.id, currentUserId);
            const draft = drafts[operator.id] ?? operator.role;
            const asking = pending?.userId === operator.id;
            return (
              <li
                key={operator.id}
                className="rounded-lg border border-white/10 bg-white/5 px-4 py-3"
                data-testid={self ? 'people-current' : `people-${operator.id}`}
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="font-medium text-slate-100">{operator.displayName}</p>
                    {self ? (
                      <p className="mt-1 text-xs uppercase tracking-wide text-sky-300">
                        {PEOPLE_YOU_LABEL}
                      </p>
                    ) : null}
                    <p className="mt-2 text-sm text-slate-400">{operator.email}</p>
                    <p className="mt-1 text-sm text-slate-500">
                      Current role: {roleLabel(operator.role)}
                    </p>
                    {operator.status !== 'Active' ? (
                      <p className="mt-1 text-sm text-slate-500">Status: {operator.status}</p>
                    ) : null}
                  </div>
                  {asking && pending && pendingOperator ? (
                    <div className="max-w-sm space-y-2">
                      <p role="status" className="text-sm text-slate-300">
                        {confirmRoleChangePrompt(pendingOperator.displayName, pending.role)}
                      </p>
                      <div className="flex flex-wrap gap-2">
                        <button
                          type="button"
                          disabled={busy}
                          onClick={onConfirm}
                          className="rounded-lg bg-white px-3 py-1.5 text-sm font-medium text-black disabled:opacity-50"
                        >
                          {busy ? 'Working…' : PEOPLE_CONFIRM_LABEL}
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
                  ) : (
                    <div className="flex flex-wrap items-center gap-2">
                      <label className="sr-only" htmlFor={`role-${operator.id}`}>
                        Role for {operator.displayName}
                      </label>
                      <select
                        id={`role-${operator.id}`}
                        value={isPeopleRole(draft) ? draft : operator.role}
                        disabled={busy}
                        onChange={(event) => onDraft(operator.id, event.target.value)}
                        className="rounded-lg border border-white/15 bg-slate-900 px-3 py-1.5 text-sm text-slate-100 focus:outline focus:outline-2 focus:outline-offset-2 focus:outline-sky-400"
                      >
                        {PEOPLE_ROLES.map((role) => (
                          <option key={role} value={role}>
                            {roleLabel(role)}
                          </option>
                        ))}
                      </select>
                      <button
                        type="button"
                        disabled={busy || draft === operator.role || !isPeopleRole(draft)}
                        onClick={() => {
                          if (isPeopleRole(draft)) onAsk(operator.id, draft);
                        }}
                        className="rounded-lg border border-white/20 px-3 py-1.5 text-sm text-slate-200 hover:bg-white/5 focus:outline focus:outline-2 focus:outline-offset-2 focus:outline-sky-400 disabled:opacity-50"
                      >
                        {PEOPLE_CHANGE_LABEL}
                      </button>
                    </div>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      ) : null}
      {!forbidden && error === LAST_ADMIN_MESSAGE ? (
        <p className="text-sm text-slate-500">
          The product keeps at least one active Administrator.
        </p>
      ) : null}
      {!forbidden && error === PEOPLE_OWN_ROLE_NOTE ? (
        <p className="text-sm text-slate-500" data-testid="people-own-role-denied">
          The product does not let you change the role you are signed in with.
        </p>
      ) : null}
    </div>
  );
}

function isForbiddenError(err: unknown): boolean {
  return err instanceof Error && err.message.toLowerCase().includes('do not have permission');
}
