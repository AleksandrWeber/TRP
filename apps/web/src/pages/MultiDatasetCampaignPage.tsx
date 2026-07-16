import { FormEvent, useState } from 'react';
import {
  runMultiDatasetCampaign,
  type MultiDatasetCampaignRequest,
  type MultiDatasetCampaignSummary,
} from '../shared/api';
import { campaignVerdictFromSummary } from './CampaignResultsView';

const STRATEGY_OPTIONS = ['donchian-breakout', 'ema-crossover'] as const;

export function parseDatasetsRaw(raw: string): string[] {
  const datasets = raw
    .split(/[\n,]+/)
    .map((item) => item.trim())
    .filter(Boolean);
  if (datasets.length === 0) {
    throw new Error('datasets must be a non-empty list');
  }
  return datasets;
}

export function parseParamsListJson(raw: string): MultiDatasetCampaignRequest['paramsList'] {
  const parsed: unknown = JSON.parse(raw);
  if (!Array.isArray(parsed) || parsed.length === 0) {
    throw new Error('paramsList must be a non-empty JSON array');
  }
  return parsed as MultiDatasetCampaignRequest['paramsList'];
}

export async function submitMultiDatasetCampaign(input: {
  strategyId: string;
  datasetsRaw: string;
  paramsListRaw: string;
}) {
  const datasets = parseDatasetsRaw(input.datasetsRaw);
  const paramsList = parseParamsListJson(input.paramsListRaw);
  return runMultiDatasetCampaign({
    strategyId: input.strategyId.trim(),
    datasets,
    paramsList,
  });
}

function rowBestProfitFactor(
  summary: MultiDatasetCampaignSummary['campaignSummaries'][number],
  overall: MultiDatasetCampaignSummary,
): string {
  if (
    summary.bestExperimentId &&
    summary.bestExperimentId === overall.overallBestExperimentId &&
    overall.overallBestProfitFactor != null
  ) {
    return String(overall.overallBestProfitFactor);
  }
  return '—';
}

type MultiDatasetSummaryViewProps = {
  summary: MultiDatasetCampaignSummary;
};

export function MultiDatasetCampaignSummaryView({ summary }: MultiDatasetSummaryViewProps) {
  return (
    <section className="space-y-6" data-testid="multi-dataset-summary">
      <div>
        <h3 className="text-lg font-semibold">Multi-Dataset Summary</h3>
      </div>

      <dl className="grid gap-3 rounded-xl border border-white/10 bg-white/5 p-6 text-sm sm:grid-cols-2">
        <div>
          <dt className="text-slate-500">totalDatasets</dt>
          <dd data-testid="totalDatasets">{summary.totalDatasets}</dd>
        </div>
        <div>
          <dt className="text-slate-500">completedDatasets</dt>
          <dd data-testid="completedDatasets">{summary.completedDatasets}</dd>
        </div>
        <div>
          <dt className="text-slate-500">failedDatasets</dt>
          <dd data-testid="failedDatasets">{summary.failedDatasets}</dd>
        </div>
        <div>
          <dt className="text-slate-500">overallBestProfitFactor</dt>
          <dd data-testid="overallBestProfitFactor">{summary.overallBestProfitFactor ?? 'null'}</dd>
        </div>
        <div>
          <dt className="text-slate-500">overallBestExperimentId</dt>
          <dd data-testid="overallBestExperimentId">{summary.overallBestExperimentId ?? 'null'}</dd>
        </div>
      </dl>

      <div className="overflow-x-auto rounded-xl border border-white/10">
        <table className="min-w-full text-left text-sm text-slate-200" data-testid="dataset-table">
          <thead className="bg-white/5 text-slate-400">
            <tr>
              <th className="px-4 py-3 font-medium">datasetId</th>
              <th className="px-4 py-3 font-medium">campaign verdict</th>
              <th className="px-4 py-3 font-medium">bestExperimentId</th>
              <th className="px-4 py-3 font-medium">bestProfitFactor</th>
            </tr>
          </thead>
          <tbody>
            {summary.campaignSummaries.map((item) => (
              <tr
                key={item.campaignId}
                className="border-t border-white/10"
                data-testid="dataset-row"
              >
                <td className="px-4 py-3">{item.datasetId}</td>
                <td className="px-4 py-3">{campaignVerdictFromSummary(item)}</td>
                <td className="px-4 py-3">{item.bestExperimentId ?? 'null'}</td>
                <td className="px-4 py-3">{rowBestProfitFactor(item, summary)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

export function MultiDatasetCampaignPage() {
  const [strategyId, setStrategyId] = useState<string>(STRATEGY_OPTIONS[0]);
  const [datasetsRaw, setDatasetsRaw] = useState('');
  const [paramsListRaw, setParamsListRaw] = useState('[{"channelPeriod":10}]');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [summary, setSummary] = useState<MultiDatasetCampaignSummary | null>(null);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError(null);
    setSummary(null);
    try {
      const result = await submitMultiDatasetCampaign({
        strategyId,
        datasetsRaw,
        paramsListRaw,
      });
      setSummary(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Multi-dataset campaign failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="space-y-8" data-testid="multi-dataset-campaign-page">
      <div>
        <h2 className="text-2xl font-semibold">Multi-Dataset Campaign</h2>
        <p className="mt-2 text-slate-400">
          Run one campaign per dataset via `POST /campaigns/run-multi`.
        </p>
      </div>

      {error && (
        <div
          className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200"
          data-testid="multi-dataset-error"
        >
          {error}
        </div>
      )}

      <form
        onSubmit={onSubmit}
        className="space-y-3 rounded-xl border border-white/10 bg-white/5 p-6"
        data-testid="multi-dataset-form"
      >
        <label className="block space-y-1 text-sm">
          <span className="text-slate-400">strategyId</span>
          <select
            value={strategyId}
            onChange={(e) => setStrategyId(e.target.value)}
            className="w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2"
            data-testid="strategy-select"
          >
            {STRATEGY_OPTIONS.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </label>
        <label className="block space-y-1 text-sm">
          <span className="text-slate-400">datasets (one per line or comma-separated)</span>
          <textarea
            value={datasetsRaw}
            onChange={(e) => setDatasetsRaw(e.target.value)}
            rows={4}
            className="w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2 font-mono text-xs"
            data-testid="datasets-input"
          />
        </label>
        <label className="block space-y-1 text-sm">
          <span className="text-slate-400">paramsList (JSON)</span>
          <textarea
            value={paramsListRaw}
            onChange={(e) => setParamsListRaw(e.target.value)}
            required
            rows={8}
            className="w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2 font-mono text-xs"
            data-testid="params-input"
          />
        </label>
        <button
          type="submit"
          disabled={loading}
          className="rounded-lg bg-white px-4 py-2 text-sm font-medium text-black disabled:opacity-50"
          data-testid="run-multi-button"
        >
          {loading ? 'Running…' : 'Run'}
        </button>
      </form>

      {summary && <MultiDatasetCampaignSummaryView summary={summary} />}
    </section>
  );
}
