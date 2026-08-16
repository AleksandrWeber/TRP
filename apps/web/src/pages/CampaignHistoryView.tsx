import { CopyButton } from '../shared/CopyButton';
import { formatUtc } from '../shared/formatUtc';
import { EmptyState } from '../shared/product-ui';
import { campaignVerdictFromSummary } from './CampaignResultsView';
import { orderCampaignHistoryNewestFirst, type CampaignHistoryItem } from './campaign-history';

type CampaignHistoryViewProps = {
  items: CampaignHistoryItem[];
  onExport?: (sessionId: string, format: 'json' | 'csv') => void;
  exportingId?: string | null;
};

export function CampaignHistoryView({ items, onExport, exportingId }: CampaignHistoryViewProps) {
  const ordered = orderCampaignHistoryNewestFirst(items);

  if (ordered.length === 0) {
    return (
      <section className="space-y-3" data-testid="campaign-history">
        <h3 className="text-lg font-semibold">Campaign History</h3>
        <EmptyState
          title="No campaign history yet"
          description="Run your first campaign."
          actionTo="/campaigns/run"
          actionLabel="Run a campaign"
        />
      </section>
    );
  }

  return (
    <section className="space-y-4" data-testid="campaign-history">
      <h3 className="text-lg font-semibold">Campaign History</h3>
      <ul className="space-y-3">
        {ordered.map((summary) => (
          <li
            key={summary.campaignId}
            data-testid="campaign-history-item"
            data-campaign-id={summary.campaignId}
            className="rounded-xl border border-white/10 bg-white/5 p-4 text-sm text-slate-200"
          >
            <dl className="grid gap-2 sm:grid-cols-2">
              <Field label="Started" value={formatUtc(summary.createdAt)} />
              <CopyField label="Strategy" value={summary.strategyId} />
              <CopyField label="Dataset" value={summary.datasetId} />
              <CopyField label="Campaign" value={summary.campaignId} />
              <Field label="Total runs" value={String(summary.totalRuns)} />
              <CopyField
                label="Best experiment"
                value={summary.bestExperimentId ?? 'None'}
                copy={summary.bestExperimentId}
              />
              <Field label="Verdict" value={campaignVerdictFromSummary(summary)} />
            </dl>
            {summary.sessionId && onExport ? (
              <div className="mt-3 flex flex-wrap gap-2">
                <ExportButton
                  label="Export JSON"
                  busy={exportingId === `${summary.sessionId}:json`}
                  onClick={() => onExport(summary.sessionId!, 'json')}
                />
                <ExportButton
                  label="Export CSV"
                  busy={exportingId === `${summary.sessionId}:csv`}
                  onClick={() => onExport(summary.sessionId!, 'csv')}
                />
              </div>
            ) : null}
          </li>
        ))}
      </ul>
    </section>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-slate-500">{label}</dt>
      <dd>{value}</dd>
    </div>
  );
}

function CopyField({ label, value, copy }: { label: string; value: string; copy?: string | null }) {
  const copied = copy ?? (value === 'None' ? null : value);
  return (
    <div>
      <dt className="text-slate-500">{label}</dt>
      <dd className="flex flex-wrap items-center gap-2 break-all">
        <span>{value}</span>
        {copied ? <CopyButton value={copied} /> : null}
      </dd>
    </div>
  );
}

function ExportButton({
  label,
  busy,
  onClick,
}: {
  label: string;
  busy: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      data-testid="campaign-export"
      onClick={onClick}
      disabled={busy}
      className="rounded border border-white/15 px-2 py-1 text-xs text-slate-300 hover:bg-white/5 focus:outline focus:outline-2 focus:outline-offset-2 focus:outline-sky-400 disabled:opacity-50"
    >
      {busy ? 'Exporting…' : label}
    </button>
  );
}
