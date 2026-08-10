type Props = {
  message: string;
};

/** Foundation placeholder — panel exists but is not wired to projections yet. */
export function PanelPlaceholder({ message }: Props) {
  return (
    <div
      className="rounded-lg border border-dashed border-white/10 bg-white/[0.02] px-4 py-6 text-center"
      data-testid="panel-placeholder"
    >
      <p className="text-sm text-slate-400">{message}</p>
      <p className="mt-2 text-xs text-slate-600">
        Projection wiring arrives in a later RC-20 epic.
      </p>
    </div>
  );
}
