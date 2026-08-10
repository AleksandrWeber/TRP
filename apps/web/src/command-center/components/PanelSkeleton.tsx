type Props = {
  rows?: number;
  label?: string;
};

/** In-panel loading skeleton — never blanks the whole workspace. */
export function PanelSkeleton({ rows = 3, label = 'Loading…' }: Props) {
  return (
    <div
      className="space-y-2"
      role="status"
      aria-busy="true"
      aria-label={label}
      data-testid="panel-skeleton"
    >
      {Array.from({ length: rows }, (_, index) => (
        <div
          key={index}
          className="h-3 rounded bg-white/10"
          style={{ width: `${88 - index * 12}%` }}
        />
      ))}
      <span className="sr-only">{label}</span>
    </div>
  );
}
