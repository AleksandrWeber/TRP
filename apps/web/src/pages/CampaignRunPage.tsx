import { FormEvent, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { runCampaign, type CampaignRunRequest } from '../shared/api';

export function parseParamsListJson(raw: string): CampaignRunRequest['paramsList'] {
  const parsed: unknown = JSON.parse(raw);
  if (!Array.isArray(parsed) || parsed.length === 0) {
    throw new Error('paramsList must be a non-empty JSON array');
  }
  return parsed as CampaignRunRequest['paramsList'];
}

export async function submitCampaignRun(input: {
  datasetId: string;
  strategyId: string;
  paramsListRaw: string;
}) {
  const paramsList = parseParamsListJson(input.paramsListRaw);
  return runCampaign({
    datasetId: input.datasetId.trim(),
    strategyId: input.strategyId.trim(),
    paramsList,
  });
}

export function CampaignRunPage() {
  const navigate = useNavigate();
  const [datasetId, setDatasetId] = useState('');
  const [strategyId, setStrategyId] = useState('donchian-breakout');
  const [paramsListRaw, setParamsListRaw] = useState('[{"channelPeriod":10}]');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const summary = await submitCampaignRun({
        datasetId,
        strategyId,
        paramsListRaw,
      });
      navigate('/campaigns/results', { state: { summary } });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Campaign run failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="space-y-8">
      <div>
        <h2 className="text-2xl font-semibold">Campaign Run</h2>
        <p className="mt-2 text-slate-400">
          Run a parameter list through the existing Campaign API (`POST /campaigns/run`).
        </p>
      </div>

      {error && (
        <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
          {error}
        </div>
      )}

      <form
        onSubmit={onSubmit}
        className="space-y-3 rounded-xl border border-white/10 bg-white/5 p-6"
      >
        <label className="block space-y-1 text-sm">
          <span className="text-slate-400">datasetId</span>
          <input
            value={datasetId}
            onChange={(e) => setDatasetId(e.target.value)}
            required
            className="w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2"
          />
        </label>
        <label className="block space-y-1 text-sm">
          <span className="text-slate-400">strategyId</span>
          <input
            value={strategyId}
            onChange={(e) => setStrategyId(e.target.value)}
            required
            className="w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2"
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
          />
        </label>
        <button
          type="submit"
          disabled={loading}
          className="rounded-lg bg-white px-4 py-2 text-sm font-medium text-black disabled:opacity-50"
        >
          {loading ? 'Running…' : 'Run Campaign'}
        </button>
      </form>
    </section>
  );
}
