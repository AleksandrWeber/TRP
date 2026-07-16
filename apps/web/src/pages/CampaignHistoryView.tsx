import type { CampaignSummary } from '../shared/api';
import { campaignVerdictFromSummary } from './CampaignResultsView';
import { orderCampaignHistoryNewestFirst } from './campaign-history';

type CampaignHistoryViewProps = {
  items: CampaignSummary[];
};

export function CampaignHistoryView({ items }: CampaignHistoryViewProps) {
  const ordered = orderCampaignHistoryNewestFirst(items);

  if (ordered.length === 0) {
    return (
      <section className="space-y-3" data-testid="campaign-history">
        <h3 className="text-lg font-semibold">Campaign History</h3>
        <p className="text-sm text-slate-400">No local campaign runs yet.</p>
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
              <div>
                <dt className="text-slate-500">startedAt</dt>
                <dd>{summary.createdAt}</dd>
              </div>
              <div>
                <dt className="text-slate-500">strategyId</dt>
                <dd>{summary.strategyId}</dd>
              </div>
              <div>
                <dt className="text-slate-500">datasetId</dt>
                <dd>{summary.datasetId}</dd>
              </div>
              <div>
                <dt className="text-slate-500">totalRuns</dt>
                <dd>{summary.totalRuns}</dd>
              </div>
              <div>
                <dt className="text-slate-500">bestExperimentId</dt>
                <dd>{summary.bestExperimentId ?? 'null'}</dd>
              </div>
              <div>
                <dt className="text-slate-500">verdict</dt>
                <dd>{campaignVerdictFromSummary(summary)}</dd>
              </div>
            </dl>
          </li>
        ))}
      </ul>
    </section>
  );
}
