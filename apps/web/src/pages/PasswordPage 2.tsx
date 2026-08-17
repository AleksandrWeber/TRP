import { FormEvent, useState } from 'react';
import { api } from '../shared/api';
import { toUserFacingError } from '../shared/mapApiError';
import {
  PRODUCT_PASSWORD_POLICY_HINT,
  productPasswordPolicyMessage,
} from '../shared/passwordPolicy';
import { ErrorBanner, PageHeader, SuccessBanner } from '../shared/product-ui';
import {
  CHANGE_PASSWORD_DESCRIPTION,
  CHANGE_PASSWORD_PROMPT,
  CHANGE_PASSWORD_SUCCESS,
  CHANGE_PASSWORD_TITLE,
} from './passwordRecovery';

export function PasswordPage() {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [busy, setBusy] = useState(false);

  function validate(): string | null {
    if (!currentPassword) return 'Enter your current password.';
    const policy = productPasswordPolicyMessage(newPassword);
    if (policy) return policy;
    if (newPassword !== confirm) return 'Passwords do not match.';
    return null;
  }

  async function onConfirm(event: FormEvent) {
    event.preventDefault();
    const invalid = validate();
    if (invalid) {
      setError(invalid);
      setSuccess(null);
      return;
    }
    if (!pending) {
      setPending(true);
      setError(null);
      return;
    }
    setBusy(true);
    setError(null);
    setSuccess(null);
    try {
      await api.changePassword(currentPassword, newPassword);
      setSuccess(CHANGE_PASSWORD_SUCCESS);
      setCurrentPassword('');
      setNewPassword('');
      setConfirm('');
      setPending(false);
    } catch (err) {
      setError(toUserFacingError(err, 'Could not change your password.'));
    } finally {
      setBusy(false);
    }
  }

  return (
    <PasswordForm
      currentPassword={currentPassword}
      newPassword={newPassword}
      confirm={confirm}
      error={error}
      success={success}
      pending={pending}
      busy={busy}
      onCurrentChange={setCurrentPassword}
      onNewChange={setNewPassword}
      onConfirmChange={setConfirm}
      onCancelPending={() => setPending(false)}
      onSubmit={onConfirm}
    />
  );
}

export function PasswordForm({
  currentPassword,
  newPassword,
  confirm,
  error,
  success,
  pending,
  busy,
  onCurrentChange,
  onNewChange,
  onConfirmChange,
  onCancelPending,
  onSubmit,
}: {
  currentPassword: string;
  newPassword: string;
  confirm: string;
  error: string | null;
  success: string | null;
  pending: boolean;
  busy: boolean;
  onCurrentChange: (value: string) => void;
  onNewChange: (value: string) => void;
  onConfirmChange: (value: string) => void;
  onCancelPending: () => void;
  onSubmit: (event: FormEvent) => void;
}) {
  return (
    <div className="space-y-6">
      <PageHeader
        productId="password"
        title={CHANGE_PASSWORD_TITLE}
        description={CHANGE_PASSWORD_DESCRIPTION}
      />
      <ErrorBanner message={error} />
      <SuccessBanner message={success} />
      <form onSubmit={onSubmit} noValidate className="max-w-md space-y-4">
        <label className="block space-y-1 text-sm">
          <span className="text-slate-400">Current password</span>
          <input
            type="password"
            name="current-password"
            autoComplete="current-password"
            value={currentPassword}
            onChange={(event) => onCurrentChange(event.target.value)}
            disabled={busy}
            className="w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2 outline-none focus:border-white/30 disabled:opacity-50"
          />
        </label>
        <label className="block space-y-1 text-sm">
          <span className="text-slate-400">New password</span>
          <input
            type="password"
            name="new-password"
            autoComplete="new-password"
            value={newPassword}
            onChange={(event) => onNewChange(event.target.value)}
            disabled={busy}
            className="w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2 outline-none focus:border-white/30 disabled:opacity-50"
          />
          <span className="block text-xs text-slate-500">{PRODUCT_PASSWORD_POLICY_HINT}</span>
        </label>
        <label className="block space-y-1 text-sm">
          <span className="text-slate-400">Confirm new password</span>
          <input
            type="password"
            name="confirm-password"
            autoComplete="new-password"
            value={confirm}
            onChange={(event) => onConfirmChange(event.target.value)}
            disabled={busy}
            className="w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2 outline-none focus:border-white/30 disabled:opacity-50"
          />
        </label>
        {pending ? (
          <div className="space-y-2">
            <p role="status" className="text-sm text-slate-300">
              {CHANGE_PASSWORD_PROMPT}
            </p>
            <div className="flex flex-wrap gap-2">
              <button
                type="submit"
                disabled={busy}
                className="rounded-lg bg-white px-3 py-1.5 text-sm font-medium text-black disabled:opacity-50"
              >
                {busy ? 'Saving…' : 'Change password'}
              </button>
              <button
                type="button"
                disabled={busy}
                onClick={onCancelPending}
                className="rounded-lg px-3 py-1.5 text-sm text-slate-400 hover:text-white disabled:opacity-50"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <button
            type="submit"
            disabled={busy}
            className="rounded-lg bg-white px-4 py-2 text-sm font-medium text-black disabled:opacity-50"
          >
            Change password
          </button>
        )}
      </form>
    </div>
  );
}
