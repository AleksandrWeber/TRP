type Props = {
  title: string;
  description: string;
};

/** Empty state — explain what / why / next; never a dead void. */
export function PanelEmptyState({ title, description }: Props) {
  return (
    <div
      className="rounded-lg border border-dashed border-white/15 px-4 py-6 text-center"
      data-testid="panel-empty-state"
    >
      <p className="text-sm font-medium text-slate-300">{title}</p>
      <p className="mt-2 text-xs text-slate-500">{description}</p>
    </div>
  );
}
