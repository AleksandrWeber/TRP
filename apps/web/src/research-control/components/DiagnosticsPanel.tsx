import type { ResearchControlDiagnostics } from '../api';

type Props = {
  diagnostics: ResearchControlDiagnostics | null | undefined;
};

export function DiagnosticsPanel({ diagnostics }: Props) {
  if (!diagnostics) {
    return (
      <div className="rounded-lg border border-dashed border-white/10 px-4 py-6 text-sm text-slate-500">
        No diagnostics available.
      </div>
    );
  }

  const sections = [
    { title: 'Warnings', items: diagnostics.warnings, tone: 'text-amber-200' },
    { title: 'Anomalies', items: diagnostics.anomalies, tone: 'text-red-200' },
    {
      title: 'Recommendations',
      items: diagnostics.recommendations,
      tone: 'text-sky-200',
    },
  ] as const;

  const hasContent =
    sections.some((s) => s.items.length > 0) || diagnostics.eventEmission.length > 0;

  if (!hasContent) {
    return (
      <div className="rounded-lg border border-white/10 px-4 py-6 text-sm text-slate-500">
        Diagnostics are empty for this run.
      </div>
    );
  }

  return (
    <div className="space-y-4" aria-label="Diagnostics">
      {sections.map((section) =>
        section.items.length > 0 ? (
          <div key={section.title}>
            <h4 className="mb-2 text-sm font-medium text-slate-300">{section.title}</h4>
            <ul className="space-y-1">
              {section.items.map((item) => (
                <li
                  key={`${section.title}-${item}`}
                  className={`rounded border border-white/10 px-3 py-2 text-sm ${section.tone}`}
                >
                  {item}
                </li>
              ))}
            </ul>
          </div>
        ) : null,
      )}
      {diagnostics.eventEmission.length > 0 ? (
        <div>
          <h4 className="mb-2 text-sm font-medium text-slate-300">Event emission diagnostics</h4>
          <pre className="max-h-48 overflow-auto rounded border border-white/10 bg-black/30 p-3 text-xs text-slate-400">
            {JSON.stringify(diagnostics.eventEmission, null, 2)}
          </pre>
        </div>
      ) : null}
    </div>
  );
}
