type Props = {
  open: boolean;
  title: string;
  confirmLabel: string;
  name: string;
  fieldError: string | null;
  loading: boolean;
  onNameChange: (value: string) => void;
  onConfirm: () => void;
  onCancel: () => void;
};

export function WorkspaceNameDialog({
  open,
  title,
  confirmLabel,
  name,
  fieldError,
  loading,
  onNameChange,
  onConfirm,
  onCancel,
}: Props) {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="workspace-name-dialog-title"
    >
      <form
        className="w-full max-w-md rounded-lg border border-white/15 bg-slate-950 p-5 shadow-xl"
        onSubmit={(event) => {
          event.preventDefault();
          if (!loading) onConfirm();
        }}
      >
        <h2 id="workspace-name-dialog-title" className="text-lg font-semibold text-white">
          {title}
        </h2>
        <label className="mt-4 block space-y-1 text-sm">
          <span className="text-slate-400">Name</span>
          <input
            value={name}
            onChange={(event) => onNameChange(event.target.value)}
            disabled={loading}
            autoFocus
            className="w-full rounded border border-white/10 bg-slate-900 px-3 py-2 text-sm text-slate-100 outline-none focus:border-sky-400/50 disabled:opacity-50"
          />
        </label>
        {fieldError ? (
          <p role="alert" className="mt-2 text-sm text-red-200">
            {fieldError}
          </p>
        ) : null}
        <div className="mt-5 flex justify-end gap-3">
          <button
            type="button"
            onClick={onCancel}
            disabled={loading}
            className="rounded border border-white/15 px-3 py-1.5 text-sm text-slate-300 hover:bg-white/5 focus:outline focus:outline-2 focus:outline-offset-2 focus:outline-sky-400 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="rounded bg-sky-600 px-3 py-1.5 text-sm text-white hover:bg-sky-500 focus:outline focus:outline-2 focus:outline-offset-2 focus:outline-sky-400 disabled:opacity-50"
          >
            {loading ? 'Saving…' : confirmLabel}
          </button>
        </div>
      </form>
    </div>
  );
}
