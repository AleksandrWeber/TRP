import { FormEvent, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../shared/api';
import { toUserFacingError } from '../shared/mapApiError';
import {
  PRODUCT_PASSWORD_POLICY_HINT,
  productPasswordPolicyMessage,
} from '../shared/passwordPolicy';
import {
  INVALID_RECOVERY_COPY,
  RESET_PASSWORD_DESCRIPTION,
  RESET_PASSWORD_TITLE,
} from './passwordRecovery';

function readToken(): string {
  if (typeof window === 'undefined') return '';
  return new URLSearchParams(window.location.search).get('token')?.trim() ?? '';
}

export function ResetPasswordPage() {
  const navigate = useNavigate();
  const token = useMemo(() => readToken(), []);
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState<string | null>(token ? null : INVALID_RECOVERY_COPY);
  const [loading, setLoading] = useState(false);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    if (!token) {
      setError(INVALID_RECOVERY_COPY);
      return;
    }
    const policy = productPasswordPolicyMessage(password);
    if (policy) {
      setError(policy);
      return;
    }
    if (password !== confirm) {
      setError('Passwords do not match.');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      await api.resetPassword(token, password);
      navigate('/login');
    } catch (err) {
      setError(toUserFacingError(err, INVALID_RECOVERY_COPY));
    } finally {
      setLoading(false);
    }
  }

  return (
    <ResetPasswordForm
      password={password}
      confirm={confirm}
      error={error}
      loading={loading}
      missingToken={!token}
      onPasswordChange={setPassword}
      onConfirmChange={setConfirm}
      onSubmit={onSubmit}
    />
  );
}

export function ResetPasswordForm({
  password,
  confirm,
  error,
  loading,
  missingToken,
  onPasswordChange,
  onConfirmChange,
  onSubmit,
}: {
  password: string;
  confirm: string;
  error: string | null;
  loading: boolean;
  missingToken: boolean;
  onPasswordChange: (value: string) => void;
  onConfirmChange: (value: string) => void;
  onSubmit: (event: FormEvent) => void;
}) {
  return (
    <div className="flex min-h-screen items-center justify-center px-6">
      <form
        onSubmit={onSubmit}
        noValidate
        className="w-full max-w-md space-y-5 rounded-xl border border-white/10 bg-white/5 p-8"
      >
        <div>
          <p className="text-sm uppercase tracking-[0.2em] text-slate-400">TRP</p>
          <h1 className="mt-1 text-2xl font-semibold">{RESET_PASSWORD_TITLE}</h1>
          <p className="mt-2 text-sm text-slate-400">{RESET_PASSWORD_DESCRIPTION}</p>
        </div>
        {error ? (
          <p
            role="alert"
            className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-200"
          >
            {error}
          </p>
        ) : null}
        <label className="block space-y-1 text-sm">
          <span className="text-slate-400">New password</span>
          <input
            type="password"
            name="new-password"
            autoComplete="new-password"
            value={password}
            onChange={(event) => onPasswordChange(event.target.value)}
            disabled={loading || missingToken}
            className="w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2 outline-none focus:border-white/30 disabled:opacity-50"
          />
          <span className="block text-xs text-slate-500">{PRODUCT_PASSWORD_POLICY_HINT}</span>
        </label>
        <label className="block space-y-1 text-sm">
          <span className="text-slate-400">Confirm password</span>
          <input
            type="password"
            name="confirm-password"
            autoComplete="new-password"
            value={confirm}
            onChange={(event) => onConfirmChange(event.target.value)}
            disabled={loading || missingToken}
            className="w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2 outline-none focus:border-white/30 disabled:opacity-50"
          />
        </label>
        <button
          type="submit"
          disabled={loading || missingToken}
          className="w-full rounded-lg bg-white px-4 py-2 text-sm font-medium text-black disabled:opacity-50"
        >
          {loading ? 'Saving…' : 'Set new password'}
        </button>
        <p className="text-center text-sm text-slate-400">
          <a href="/login" className="text-white underline-offset-2 hover:underline">
            Back to sign in
          </a>
        </p>
      </form>
    </div>
  );
}
