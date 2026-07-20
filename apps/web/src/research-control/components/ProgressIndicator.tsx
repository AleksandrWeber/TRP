type Props = {
  value: number;
  label?: string;
};

export function ProgressIndicator({ value, label = 'Progress' }: Props) {
  const clamped = Math.max(0, Math.min(100, Number.isFinite(value) ? value : 0));

  return (
    <div className="space-y-1" aria-label={`${label}: ${clamped}%`}>
      <div className="flex justify-between text-xs text-slate-400">
        <span>{label}</span>
        <span>{clamped}%</span>
      </div>
      <div
        className="h-2 overflow-hidden rounded bg-slate-800"
        role="progressbar"
        aria-valuenow={clamped}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        <div
          className="h-full rounded bg-sky-500 transition-[width] duration-300"
          style={{ width: `${clamped}%` }}
        />
      </div>
    </div>
  );
}
