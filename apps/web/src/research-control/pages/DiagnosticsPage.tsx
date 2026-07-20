import { EmptyState, ErrorPanel, LoadingOverlay, RecommendationList } from '../components';
import { useDiagnostics } from '../hooks';

export function DiagnosticsPage() {
  const { data, isLoading, isError, error, refetch } = useDiagnostics();

  return (
    <section className="relative space-y-6">
      <LoadingOverlay visible={isLoading} />
      <header>
        <h2 className="text-2xl font-semibold">Diagnostics</h2>
        <p className="mt-2 text-slate-400">
          Infrastructure diagnostics across research, optimization, analytics, and engineering runs.
          Read-only.
        </p>
      </header>

      {isError ? <ErrorPanel error={error} onRetry={() => void refetch()} /> : null}

      {data ? (
        <>
          <p className="text-xs text-slate-500">Generated {data.generatedAt}</p>

          <DiagSection title="Validation warnings" items={data.warnings} tone="amber" />
          <DiagSection title="Anomalies" items={data.anomalies} tone="red" />
          <RecommendationList items={data.recommendations} />

          {data.eventEmission.length > 0 ? (
            <div>
              <h3 className="mb-2 text-sm font-medium text-slate-300">
                Event emission diagnostics
              </h3>
              <pre className="max-h-64 overflow-auto rounded-lg border border-white/10 bg-black/30 p-4 text-xs text-slate-400">
                {JSON.stringify(data.eventEmission, null, 2)}
              </pre>
            </div>
          ) : null}

          {data.warnings.length === 0 &&
          data.anomalies.length === 0 &&
          data.recommendations.length === 0 &&
          data.eventEmission.length === 0 ? (
            <EmptyState
              title="No diagnostics yet"
              description="Run research or engineering suites to populate diagnostics."
            />
          ) : null}
        </>
      ) : null}
    </section>
  );
}

function DiagSection({
  title,
  items,
  tone,
}: {
  title: string;
  items: string[];
  tone: 'amber' | 'red';
}) {
  if (items.length === 0) return null;
  const toneClass =
    tone === 'amber'
      ? 'border-amber-500/20 bg-amber-500/5 text-amber-100'
      : 'border-red-500/20 bg-red-500/5 text-red-100';

  return (
    <div>
      <h3 className="mb-2 text-sm font-medium text-slate-300">{title}</h3>
      <ul className="space-y-2">
        {items.map((item) => (
          <li key={item} className={`rounded border px-3 py-2 text-sm ${toneClass}`}>
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
}
