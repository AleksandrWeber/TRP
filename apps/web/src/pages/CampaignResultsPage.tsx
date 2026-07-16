import { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import type { CampaignSummary } from '../shared/api';
import { loadCampaignHistory } from './campaign-history';
import { CampaignHistoryView } from './CampaignHistoryView';
import { CampaignResultsView } from './CampaignResultsView';

type ResultsLocationState = {
  summary?: CampaignSummary;
};

export function CampaignResultsPage() {
  const location = useLocation();
  const summary = (location.state as ResultsLocationState | null)?.summary;
  const [history, setHistory] = useState<CampaignSummary[]>([]);

  useEffect(() => {
    setHistory(loadCampaignHistory());
  }, [summary?.campaignId]);

  if (!summary) {
    return (
      <section className="space-y-6">
        <div className="space-y-4">
          <h2 className="text-2xl font-semibold">Campaign Results</h2>
          <p className="text-slate-400">No campaign result in session. Run a campaign first.</p>
          <Link to="/campaigns/run" className="text-sm text-white underline">
            Go to Campaign Run
          </Link>
        </div>
        <CampaignHistoryView items={history} />
      </section>
    );
  }

  return (
    <div className="space-y-6">
      <CampaignResultsView summary={summary} />
      <CampaignHistoryView items={history} />
      <Link to="/campaigns/run" className="text-sm text-slate-400 hover:text-white">
        Run another campaign
      </Link>
    </div>
  );
}
