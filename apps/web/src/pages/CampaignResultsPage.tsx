import { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { analyzeCampaign, type CampaignSummary, type ResearchAnalysis } from '../shared/api';
import { loadCampaignHistory } from './campaign-history';
import { CampaignAnalysisView } from './CampaignAnalysisView';
import { CampaignHistoryView } from './CampaignHistoryView';
import { CampaignResultsView } from './CampaignResultsView';

type ResultsLocationState = {
  summary?: CampaignSummary;
};

export function CampaignResultsPage() {
  const location = useLocation();
  const summary = (location.state as ResultsLocationState | null)?.summary;
  const [history, setHistory] = useState<CampaignSummary[]>([]);
  const [analysis, setAnalysis] = useState<ResearchAnalysis | null>(null);
  const [analysisError, setAnalysisError] = useState<string | null>(null);
  const [analysisLoading, setAnalysisLoading] = useState(false);

  useEffect(() => {
    setHistory(loadCampaignHistory());
  }, [summary?.campaignId]);

  useEffect(() => {
    if (!summary) {
      setAnalysis(null);
      setAnalysisError(null);
      return;
    }

    let cancelled = false;
    setAnalysisLoading(true);
    setAnalysisError(null);

    analyzeCampaign(summary)
      .then((result) => {
        if (!cancelled) setAnalysis(result);
      })
      .catch((err) => {
        if (!cancelled) {
          setAnalysis(null);
          setAnalysisError(err instanceof Error ? err.message : 'Analysis failed');
        }
      })
      .finally(() => {
        if (!cancelled) setAnalysisLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [summary]);

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
      {analysisLoading && <p className="text-sm text-slate-400">Loading analysis…</p>}
      {analysisError && (
        <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
          {analysisError}
        </div>
      )}
      {analysis && <CampaignAnalysisView analysis={analysis} />}
      <CampaignHistoryView items={history} />
      <Link to="/campaigns/run" className="text-sm text-slate-400 hover:text-white">
        Run another campaign
      </Link>
    </div>
  );
}
