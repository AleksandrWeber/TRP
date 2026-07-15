import { FormEvent, useState } from 'react';
import { api } from '../shared/api';

export function AiPage() {
  const [experimentId, setExperimentId] = useState('');
  const [content, setContent] = useState<string | null>(null);
  const [meta, setMeta] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const experiment = await api.getExperiment(experimentId);
      const result = await api.aiExecute('research_summary', {
        experimentId: experiment.id,
        strategyId: experiment.strategyId,
        verdict: experiment.verdict,
        metrics: experiment.metrics,
        validation: experiment.validation,
      });
      setContent(result.content);
      setMeta(`${result.provider} · ${result.model}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'AI request failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="space-y-8">
      <div>
        <h2 className="text-2xl font-semibold">AI Assistant</h2>
        <p className="mt-2 text-slate-400">
          Implementation 016 — OpenRouter Gateway (offline fallback if no API key)
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
          <span className="text-slate-400">Experiment ID</span>
          <input
            value={experimentId}
            onChange={(e) => setExperimentId(e.target.value)}
            required
            className="w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2"
          />
        </label>
        <button
          type="submit"
          disabled={loading}
          className="rounded-lg bg-white px-4 py-2 text-sm font-medium text-black disabled:opacity-50"
        >
          {loading ? 'Summarizing…' : 'Summarize experiment'}
        </button>
      </form>

      {content && (
        <div className="rounded-xl border border-white/10 bg-white/5 p-6">
          {meta && <p className="mb-3 text-xs text-slate-500">{meta}</p>}
          <pre className="whitespace-pre-wrap text-sm text-slate-200">{content}</pre>
        </div>
      )}
    </section>
  );
}
