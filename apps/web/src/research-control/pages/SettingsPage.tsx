import { useEffect, useState } from 'react';
import { ErrorPanel, LoadingOverlay } from '../components';
import { useSettings, useUpdateSettings } from '../hooks';

export function SettingsPage() {
  const settings = useSettings();
  const update = useUpdateSettings();
  const [autoRefreshSeconds, setAutoRefreshSeconds] = useState(5);
  const [defaultStrategyId, setDefaultStrategyId] = useState('research-control-strategy');
  const [maxListedExecutions, setMaxListedExecutions] = useState(100);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (settings.data) {
      setAutoRefreshSeconds(settings.data.autoRefreshSeconds);
      setDefaultStrategyId(settings.data.defaultStrategyId);
      setMaxListedExecutions(settings.data.maxListedExecutions);
    }
  }, [settings.data]);

  async function handleSave(event: React.FormEvent) {
    event.preventDefault();
    setSaved(false);
    await update.mutateAsync({
      autoRefreshSeconds,
      defaultStrategyId,
      maxListedExecutions,
    });
    setSaved(true);
  }

  return (
    <section className="relative space-y-6">
      <LoadingOverlay visible={settings.isLoading} />
      <header>
        <h2 className="text-2xl font-semibold">Settings</h2>
        <p className="mt-2 text-slate-400">
          Research Control Center preferences. No trading configuration.
        </p>
      </header>

      {settings.isError ? (
        <ErrorPanel error={settings.error} onRetry={() => void settings.refetch()} />
      ) : null}
      {update.isError ? <ErrorPanel error={update.error} /> : null}
      {saved ? (
        <p
          className="rounded border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-200"
          role="status"
        >
          Settings saved.
        </p>
      ) : null}

      <form
        onSubmit={(e) => void handleSave(e)}
        className="max-w-lg space-y-4 rounded-lg border border-white/10 p-4"
      >
        <label className="block text-sm text-slate-400">
          Auto-refresh interval (seconds)
          <input
            type="number"
            min={1}
            max={120}
            value={autoRefreshSeconds}
            onChange={(e) => setAutoRefreshSeconds(Number(e.target.value))}
            className="mt-1 w-full rounded border border-white/15 bg-slate-950 px-3 py-2 text-white focus:outline focus:outline-2 focus:outline-offset-2 focus:outline-sky-400"
          />
        </label>
        <label className="block text-sm text-slate-400">
          Default strategy ID
          <input
            type="text"
            value={defaultStrategyId}
            onChange={(e) => setDefaultStrategyId(e.target.value)}
            className="mt-1 w-full rounded border border-white/15 bg-slate-950 px-3 py-2 text-white focus:outline focus:outline-2 focus:outline-offset-2 focus:outline-sky-400"
          />
        </label>
        <label className="block text-sm text-slate-400">
          Max listed executions
          <input
            type="number"
            min={10}
            max={500}
            value={maxListedExecutions}
            onChange={(e) => setMaxListedExecutions(Number(e.target.value))}
            className="mt-1 w-full rounded border border-white/15 bg-slate-950 px-3 py-2 text-white focus:outline focus:outline-2 focus:outline-offset-2 focus:outline-sky-400"
          />
        </label>
        <button
          type="submit"
          disabled={update.isPending}
          className="rounded bg-sky-600 px-4 py-2 text-sm text-white hover:bg-sky-500 disabled:opacity-50 focus:outline focus:outline-2 focus:outline-offset-2 focus:outline-sky-400"
        >
          {update.isPending ? 'Saving…' : 'Save settings'}
        </button>
      </form>
    </section>
  );
}
