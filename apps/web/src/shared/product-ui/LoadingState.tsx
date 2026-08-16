export function LoadingState({ label = 'Loading…', testId }: { label?: string; testId?: string }) {
  return (
    <p className="text-sm text-slate-500" role="status" aria-live="polite" data-testid={testId}>
      {label}
    </p>
  );
}
