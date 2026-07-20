type Props = {
  visible: boolean;
  label?: string;
};

export function LoadingOverlay({ visible, label = 'Loading…' }: Props) {
  if (!visible) return null;

  return (
    <div
      className="absolute inset-0 z-20 flex items-center justify-center rounded-lg bg-slate-950/70"
      role="status"
      aria-live="polite"
      aria-busy="true"
    >
      <div className="flex items-center gap-3 rounded border border-white/10 bg-slate-900 px-4 py-3 text-sm text-slate-200">
        <span
          className="h-4 w-4 animate-spin rounded-full border-2 border-sky-400 border-t-transparent"
          aria-hidden
        />
        {label}
      </div>
    </div>
  );
}
