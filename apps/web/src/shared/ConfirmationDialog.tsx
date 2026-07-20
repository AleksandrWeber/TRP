type Props = {
  open: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  /** Destructive styling for irreversible actions. */
  variant?: 'default' | 'danger';
  /** When set, confirm stays disabled until the user types this phrase. */
  requireTypedPhrase?: string;
  typedValue?: string;
  onTypedValueChange?: (value: string) => void;
  onConfirm: () => void;
  onCancel: () => void;
};

/**
 * Modal confirmation dialog for destructive / irreversible actions.
 */
export function ConfirmationDialog({
  open,
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  variant = 'default',
  requireTypedPhrase,
  typedValue = '',
  onTypedValueChange,
  onConfirm,
  onCancel,
}: Props) {
  if (!open) return null;

  const phraseOk =
    requireTypedPhrase === undefined ||
    typedValue.trim().toUpperCase() === requireTypedPhrase.trim().toUpperCase();

  const confirmClass =
    variant === 'danger'
      ? 'rounded bg-red-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-red-500 disabled:opacity-40 focus:outline focus:outline-2 focus:outline-offset-2 focus:outline-red-300'
      : 'rounded bg-sky-600 px-3 py-1.5 text-sm text-white hover:bg-sky-500 disabled:opacity-40 focus:outline focus:outline-2 focus:outline-offset-2 focus:outline-sky-400';

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-dialog-title"
    >
      <div className="w-full max-w-md rounded-lg border border-white/15 bg-slate-950 p-5 shadow-xl">
        <h2 id="confirm-dialog-title" className="text-lg font-semibold text-white">
          {title}
        </h2>
        <p className="mt-2 text-sm text-slate-400">{message}</p>
        {requireTypedPhrase ? (
          <label className="mt-4 block text-xs text-slate-500">
            Type <span className="font-mono text-red-300">{requireTypedPhrase}</span> to confirm
            <input
              value={typedValue}
              onChange={(e) => onTypedValueChange?.(e.target.value)}
              autoFocus
              className="mt-1 w-full rounded border border-white/10 bg-slate-900 px-3 py-2 font-mono text-sm text-slate-100 outline-none focus:border-red-400/50"
              placeholder={requireTypedPhrase}
              autoComplete="off"
              spellCheck={false}
            />
          </label>
        ) : null}
        <div className="mt-5 flex justify-end gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="rounded border border-white/15 px-3 py-1.5 text-sm text-slate-300 hover:bg-white/5 focus:outline focus:outline-2 focus:outline-offset-2 focus:outline-sky-400"
          >
            {cancelLabel}
          </button>
          <button type="button" onClick={onConfirm} disabled={!phraseOk} className={confirmClass}>
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
