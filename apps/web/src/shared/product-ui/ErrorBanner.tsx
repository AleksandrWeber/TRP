export function ErrorBanner({
  message,
  testId,
}: {
  message: string | null | undefined;
  testId?: string;
}) {
  if (!message) return null;

  return (
    <div
      role="alert"
      className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200"
      data-testid={testId}
    >
      {message}
    </div>
  );
}
