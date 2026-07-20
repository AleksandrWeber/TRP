type Props = {
  error: Error | string | null | undefined;
  onRetry?: () => void;
  title?: string;
};

export function ErrorPanel({ error, onRetry, title = 'Something went wrong' }: Props) {
  if (!error) return null;
  const raw = typeof error === 'string' ? error : error.message;
  const isNetworkFailure =
    raw === 'Failed to fetch' ||
    raw === 'NetworkError when attempting to fetch resource.' ||
    raw.toLowerCase().includes('failed to fetch');
  const message = isNetworkFailure
    ? 'Cannot reach the API (Failed to fetch). Ensure the API is running on http://localhost:3000, then retry.'
    : raw;

  return (
    <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3" role="alert">
      <p className="text-sm font-medium text-red-200">{title}</p>
      <p className="mt-1 text-sm text-red-100/80">{message}</p>
      {onRetry ? (
        <button
          type="button"
          onClick={onRetry}
          className="mt-3 rounded border border-red-400/40 px-3 py-1 text-xs text-red-100 hover:bg-red-500/20 focus:outline focus:outline-2 focus:outline-offset-2 focus:outline-red-300"
        >
          Retry
        </button>
      ) : null}
    </div>
  );
}
