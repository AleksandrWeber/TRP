type Props = {
  open: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
};

export function ConfirmationDialog({
  open,
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  onConfirm,
  onCancel,
}: Props) {
  if (!open) return null;

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
        <div className="mt-5 flex justify-end gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="rounded border border-white/15 px-3 py-1.5 text-sm text-slate-300 hover:bg-white/5 focus:outline focus:outline-2 focus:outline-offset-2 focus:outline-sky-400"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="rounded bg-sky-600 px-3 py-1.5 text-sm text-white hover:bg-sky-500 focus:outline focus:outline-2 focus:outline-offset-2 focus:outline-sky-400"
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
