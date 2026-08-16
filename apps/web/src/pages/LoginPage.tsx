import { FormEvent, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../shared/api';
import { getActiveWorkspace, setAccessToken, setActiveWorkspace } from '../shared/auth';
import { toUserFacingError } from '../shared/mapApiError';
import { resolveActiveWorkspace } from '../workspace/resolve-active-workspace';

type Mode = 'signin' | 'register';

function isValidEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}

function toAuthError(err: unknown, mode: Mode): string {
  const fallback = mode === 'signin' ? 'Sign in failed' : 'Could not create the account';
  const message = toUserFacingError(err, fallback);
  const lower = message.toLowerCase();
  if (message === 'Unauthorized' || lower.includes('invalid credentials')) {
    return 'Invalid email or password.';
  }
  return message;
}

export function LoginPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<Mode>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [fieldError, setFieldError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  function validate(): string | null {
    if (!email.trim()) return 'Enter your email.';
    if (!isValidEmail(email)) return 'Enter a valid email address.';
    if (password.length < 8) return 'Password must be at least 8 characters.';
    if (mode === 'register' && !displayName.trim()) return 'Enter your name.';
    return null;
  }

  function switchMode(next: Mode) {
    setMode(next);
    setError(null);
    setFieldError(null);
  }

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    const invalid = validate();
    if (invalid) {
      setFieldError(invalid);
      setError(null);
      return;
    }

    setLoading(true);
    setError(null);
    setFieldError(null);
    try {
      const result =
        mode === 'register'
          ? await api.register(email.trim(), displayName.trim(), password)
          : await api.login(email.trim(), password);
      setAccessToken(result.accessToken);
      const workspace = await resolveActiveWorkspace({
        stored: getActiveWorkspace(),
        getWorkspace: (id) => api.getWorkspace(id),
        bootstrap: () => api.bootstrapWorkspace(),
      });
      setActiveWorkspace(workspace);
      navigate('/');
    } catch (err) {
      setError(toAuthError(err, mode));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-6">
      <form
        onSubmit={onSubmit}
        noValidate
        className="w-full max-w-md space-y-5 rounded-xl border border-white/10 bg-white/5 p-8"
      >
        <div>
          <p className="text-sm uppercase tracking-[0.2em] text-slate-400">TRP</p>
          <h1 className="mt-1 text-2xl font-semibold">
            {mode === 'signin' ? 'Sign in' : 'Create account'}
          </h1>
          <p className="mt-2 text-sm text-slate-400">
            {mode === 'signin'
              ? 'Sign in to the paper-first operator. Live trading is not offered.'
              : 'Create an account to enter the paper-first operator. Live trading is not offered.'}
          </p>
        </div>

        {(error || fieldError) && (
          <div
            role="alert"
            className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-200"
          >
            {error ?? fieldError}
          </div>
        )}

        {mode === 'register' && (
          <label className="block space-y-1 text-sm">
            <span className="text-slate-400">Name</span>
            <input
              type="text"
              name="displayName"
              autoComplete="name"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              disabled={loading}
              className="w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2 outline-none focus:border-white/30 disabled:opacity-50"
            />
          </label>
        )}

        <label className="block space-y-1 text-sm">
          <span className="text-slate-400">Email</span>
          <input
            type="email"
            name="email"
            autoComplete="username"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={loading}
            className="w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2 outline-none focus:border-white/30 disabled:opacity-50"
          />
        </label>

        <label className="block space-y-1 text-sm">
          <span className="text-slate-400">Password</span>
          <input
            type="password"
            name="password"
            autoComplete={mode === 'register' ? 'new-password' : 'current-password'}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={loading}
            className="w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2 outline-none focus:border-white/30 disabled:opacity-50"
          />
        </label>

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-lg bg-white px-4 py-2 text-sm font-medium text-black disabled:opacity-50"
        >
          {loading
            ? mode === 'signin'
              ? 'Signing in…'
              : 'Creating account…'
            : mode === 'signin'
              ? 'Sign in'
              : 'Create account'}
        </button>

        <p className="text-center text-sm text-slate-400">
          {mode === 'signin' ? (
            <>
              Need an account?{' '}
              <button
                type="button"
                onClick={() => switchMode('register')}
                disabled={loading}
                className="text-white underline-offset-2 hover:underline disabled:opacity-50"
              >
                Create one
              </button>
            </>
          ) : (
            <>
              Already have an account?{' '}
              <button
                type="button"
                onClick={() => switchMode('signin')}
                disabled={loading}
                className="text-white underline-offset-2 hover:underline disabled:opacity-50"
              >
                Sign in
              </button>
            </>
          )}
        </p>
      </form>
    </div>
  );
}
