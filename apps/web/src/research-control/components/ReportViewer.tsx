import { memo } from 'react';

type Props = {
  title?: string;
  data: unknown;
  emptyMessage?: string;
};

function ReportViewerComponent({
  title = 'Report',
  data,
  emptyMessage = 'No report available.',
}: Props) {
  if (data === null || data === undefined) {
    return (
      <div className="rounded-lg border border-dashed border-white/10 px-4 py-6 text-sm text-slate-500">
        {emptyMessage}
      </div>
    );
  }

  return (
    <section aria-label={title} className="space-y-2">
      <h3 className="text-sm font-medium text-slate-300">{title}</h3>
      <pre className="max-h-[28rem] overflow-auto rounded-lg border border-white/10 bg-black/30 p-4 text-xs leading-relaxed text-slate-300">
        {JSON.stringify(data, null, 2)}
      </pre>
    </section>
  );
}

export const ReportViewer = memo(ReportViewerComponent);
