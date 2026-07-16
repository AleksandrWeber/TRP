import { Link, useLocation } from 'react-router-dom';
import type { CampaignSummary } from '../shared/api';
import { CampaignResultsView } from './CampaignResultsView';

type ResultsLocationState = {
  summary?: CampaignSummary;
};

export function CampaignResultsPage() {
  const location = useLocation();
  const summary = (location.state as ResultsLocationState | null)?.summary;

  if (!summary) {
    return (
      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">Campaign Results</h2>
        <p className="text-slate-400">No campaign result in session. Run a campaign first.</p>
        <Link to="/campaigns/run" className="text-sm text-white underline">
          Go to Campaign Run
        </Link>
      </section>
    );
  }

  return (
    <div className="space-y-6">
      <CampaignResultsView summary={summary} />
      <Link to="/campaigns/run" className="text-sm text-slate-400 hover:text-white">
        Run another campaign
      </Link>
    </div>
  );
}
