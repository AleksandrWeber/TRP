import { FormEvent, useEffect, useState } from 'react';
import { api } from '../shared/api';
import { toUserFacingError } from '../shared/mapApiError';
import {
  FORGOT_PASSWORD_DESCRIPTION,
  FORGOT_PASSWORD_TITLE,
  RECOVERY_ACCEPTED_COPY,
  RECOVERY_UNAVAILABLE_COPY,
  isValidEmail,
} from './passwordRecovery';

export function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [available, setAvailable] = useState<boolean | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    void api
      .recoveryStatus()
      .then((status) => setAvailable(status.available))
      .catch(() => setAvailable(null));
  }, []);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    if (!isValidEmail(email)) {
      setError('Enter a valid email address.');
      setSuccess(null);
      return;
    }
    setLoading(true);
    setError(null);
    setSuccess(null);
    try {
      const result = await api.forgotPassword(email.trim());
      if (result.outcome === 'unavailable') {
        setAvailable(false);
        setError(result.message || RECOVERY_UNAVAILABLE_COPY);
        return;
      }
      setSuccess(result.message || RECOVERY_ACCEPTED_COPY);
    } catch (err) {
      setError(toUserFacingError(err, 'Could not request password recovery.'));
    } finally {
      setLoading(false);
    }
  }

  return (
    <ForgotPasswordForm
      email={email}
      available={available}
      error={error}
      success={success}
      loading={loading}
      onEmailChange={setEmail}
      onSubmit={onSubmit}
    />
  );
}

export function ForgotPasswordForm({
  email,
  available,
  error,
  success,
  loading,
  onEmailChange,
  onSubmit,
}: {
  email: string;
  available: boolean | null;
  error: string | null;
  success: string | null;
  loading: boolean;
  onEmailChange: (value: string) => void;
  onSubmit: (event: FormEvent) => void;
}) {
  const unavailable = available === false;

  return (
    <div className="flex min-h-screen items-center justify-center px-6">
      <form
        onSubmit={onSubmit}
        noValidate
        className="w-full max-w-md space-y-5 rounded-xl border border-white/10 bg-white/5 p-8"
      >
        <div>
          <p className="text-sm uppercase tracking-[0.2em] text-slate-400">TRP</p>
          <h1 className="mt-1 text-2xl font-semibold">{FORGOT_PASSWORD_TITLE}</h1>
          <p className="mt-2 text-sm text-slate-400">{FORGOT_PASSWORD_DESCRIPTION}</p>
        </div>
        {unavailable ? (
          <p
            role="status"
            className="rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-sm text-amber-100"
          >
            {RECOVERY_UNAVAILABLE_COPY}
          </p>
        ) : null}
        {error && !unavailable ? (
          <p
            role="alert"
            className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-200"
          >
            {error}
          </p>
        ) : null}
        {success ? (
          <p
            role="status"
            className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-200"
          >
            {success}
          </p>
        ) : null}
        <label className="block space-y-1 text-sm">
          <span className="text-slate-400">Email</span>
          <input
            type="email"
            name="email"
            autoComplete="username"
            value={email}
            onChange={(event) => onEmailChange(event.target.value)}
            disabled={loading || unavailable}
            className="w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2 outline-none focus:border-white/30 disabled:opacity-50"
          />
        </label>
        <button
          type="submit"
          disabled={loading || unavailable}
          className="w-full rounded-lg bg-white px-4 py-2 text-sm font-medium text-black disabled:opacity-50"
        >
          {loading ? 'Sending…' : 'Send recovery instructions'}
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
