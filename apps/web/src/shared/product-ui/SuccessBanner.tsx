export function SuccessBanner({
  message,
  testId,
}: {
  message: string | null | undefined | false;
  testId?: string;
}) {
  if (!message) return null;

  return (
    <p
      role="status"
      className="rounded border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-200"
      data-testid={testId}
    >
      {message}
    </p>
  );
}
