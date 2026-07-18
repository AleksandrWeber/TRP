import { FormEvent, useCallback, useEffect, useState } from 'react';
import { useWorkspace } from '../app/WorkspaceContext';
import {
  api,
  statusColor,
  type Strategy,
  type StrategyDirection,
  type StrategyStatus,
  type StrategyTimeframe,
  type UpdateStrategyRequest,
} from '../shared/api';

const STATUS_OPTIONS: StrategyStatus[] = ['draft', 'active', 'archived'];
const TIMEFRAME_OPTIONS: StrategyTimeframe[] = ['1m', '5m', '15m', '1h', '4h', '1d'];
const DIRECTION_OPTIONS: StrategyDirection[] = ['LONG', 'SHORT', 'BOTH'];

export type StrategyConfigurationDraft = {
  tradingPair: string;
  timeframe: StrategyTimeframe;
  direction: StrategyDirection;
  positionSize: number;
  stopLossPercent: number;
  takeProfitPercent: number;
  parametersText: string;
};

const DEFAULT_CONFIGURATION: StrategyConfigurationDraft = {
  tradingPair: 'BTCUSDT',
  timeframe: '1h',
  direction: 'BOTH',
  positionSize: 100,
  stopLossPercent: 2,
  takeProfitPercent: 5,
  parametersText: '{}',
};

/**
 * Strategy management UI (US004/US005).
 * List / create / edit / delete strategies in the active workspace.
 * Workspace scope comes from WorkspaceContext; headers from the shared client.
 */
export function StrategiesPage() {
  const { activeWorkspace } = useWorkspace();
  const [strategies, setStrategies] = useState<Strategy[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [configuration, setConfiguration] =
    useState<StrategyConfigurationDraft>(DEFAULT_CONFIGURATION);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editStatus, setEditStatus] = useState<StrategyStatus>('draft');
  const [editConfiguration, setEditConfiguration] =
    useState<StrategyConfigurationDraft>(DEFAULT_CONFIGURATION);

  const refresh = useCallback(async () => {
    setStrategies(await api.listStrategies());
  }, [activeWorkspace.id]);

  useEffect(() => {
    let cancelled = false;
    setError(null);
    api
      .listStrategies()
      .then((list) => {
        if (!cancelled) setStrategies(list);
      })
      .catch((err: Error) => {
        if (!cancelled) setError(err.message);
      });
    return () => {
      cancelled = true;
    };
  }, [activeWorkspace.id]);

  async function run(action: () => Promise<void>) {
    setBusy(true);
    setError(null);
    try {
      await action();
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Strategy operation failed');
    } finally {
      setBusy(false);
    }
  }

  function onCreate(event: FormEvent) {
    event.preventDefault();
    let parameters: Record<string, unknown>;
    try {
      parameters = parseParameters(configuration.parametersText);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Parameters must be valid JSON');
      return;
    }
    void run(async () => {
      await api.createStrategy({
        name,
        tradingPair: configuration.tradingPair,
        timeframe: configuration.timeframe,
        direction: configuration.direction,
        description: description || undefined,
        positionSize: configuration.positionSize,
        stopLossPercent: configuration.stopLossPercent,
        takeProfitPercent: configuration.takeProfitPercent,
        parameters,
      });
      setName('');
      setDescription('');
      setConfiguration(DEFAULT_CONFIGURATION);
    });
  }

  function startEdit(strategy: Strategy) {
    setEditingId(strategy.id);
    setEditName(strategy.name);
    setEditDescription(strategy.description);
    setEditStatus(strategy.status);
    setEditConfiguration({
      tradingPair: strategy.tradingPair,
      timeframe: strategy.timeframe,
      direction: strategy.direction,
      positionSize: strategy.positionSize,
      stopLossPercent: strategy.stopLossPercent,
      takeProfitPercent: strategy.takeProfitPercent,
      parametersText: JSON.stringify(strategy.parameters, null, 2),
    });
  }

  function onSaveEdit(event: FormEvent) {
    event.preventDefault();
    if (!editingId) return;
    let parameters: Record<string, unknown>;
    try {
      parameters = parseParameters(editConfiguration.parametersText);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Parameters must be valid JSON');
      return;
    }
    const body: UpdateStrategyRequest = {
      name: editName,
      description: editDescription,
      status: editStatus,
      tradingPair: editConfiguration.tradingPair,
      timeframe: editConfiguration.timeframe,
      direction: editConfiguration.direction,
      positionSize: editConfiguration.positionSize,
      stopLossPercent: editConfiguration.stopLossPercent,
      takeProfitPercent: editConfiguration.takeProfitPercent,
      parameters,
    };
    void run(async () => {
      await api.updateStrategy(editingId, body);
      setEditingId(null);
    });
  }

  function onDelete(id: string) {
    void run(async () => {
      await api.deleteStrategy(id);
      if (editingId === id) setEditingId(null);
    });
  }

  return (
    <section className="space-y-8" data-testid="strategies-page">
      <div>
        <h2 className="text-2xl font-semibold">Strategies</h2>
        <p className="mt-2 text-slate-400">
          US005 — complete workspace-owned strategy configuration in {activeWorkspace.name}
        </p>
      </div>

      {error && (
        <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
          {error}
        </div>
      )}

      <form
        onSubmit={onCreate}
        data-testid="create-strategy-form"
        className="space-y-3 rounded-xl border border-white/10 bg-white/5 p-6"
      >
        <h3 className="text-sm font-medium uppercase tracking-wide text-slate-400">
          Create strategy
        </h3>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          maxLength={200}
          placeholder="Strategy name"
          data-testid="strategy-name-input"
          className="w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm"
        />
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          maxLength={2000}
          rows={2}
          placeholder="Description (optional)"
          data-testid="strategy-description-input"
          className="w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm"
        />
        <div className="grid gap-3 sm:grid-cols-3">
          <label className="space-y-1 text-sm text-slate-300">
            <span>Trading pair</span>
            <input
              value={configuration.tradingPair}
              onChange={(event) =>
                setConfiguration((current) => ({
                  ...current,
                  tradingPair: event.target.value.toUpperCase(),
                }))
              }
              required
              pattern="[A-Z0-9]+"
              data-testid="strategy-trading-pair-input"
              className="w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2"
            />
          </label>
          <label className="space-y-1 text-sm text-slate-300">
            <span>Timeframe</span>
            <select
              value={configuration.timeframe}
              onChange={(event) =>
                setConfiguration((current) => ({
                  ...current,
                  timeframe: event.target.value as StrategyTimeframe,
                }))
              }
              data-testid="strategy-timeframe-select"
              className="w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2"
            >
              {TIMEFRAME_OPTIONS.map((timeframe) => (
                <option key={timeframe}>{timeframe}</option>
              ))}
            </select>
          </label>
          <label className="space-y-1 text-sm text-slate-300">
            <span>Direction</span>
            <select
              value={configuration.direction}
              onChange={(event) =>
                setConfiguration((current) => ({
                  ...current,
                  direction: event.target.value as StrategyDirection,
                }))
              }
              data-testid="strategy-direction-select"
              className="w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2"
            >
              {DIRECTION_OPTIONS.map((direction) => (
                <option key={direction}>{direction}</option>
              ))}
            </select>
          </label>
        </div>
        <div className="grid gap-3 sm:grid-cols-3">
          <NumberField
            label="Position size"
            value={configuration.positionSize}
            min={0.00000001}
            onChange={(positionSize) =>
              setConfiguration((current) => ({ ...current, positionSize }))
            }
            testId="strategy-position-size-input"
          />
          <NumberField
            label="Stop loss %"
            value={configuration.stopLossPercent}
            min={0}
            max={100}
            onChange={(stopLossPercent) =>
              setConfiguration((current) => ({ ...current, stopLossPercent }))
            }
            testId="strategy-stop-loss-input"
          />
          <NumberField
            label="Take profit %"
            value={configuration.takeProfitPercent}
            min={0}
            max={100}
            onChange={(takeProfitPercent) =>
              setConfiguration((current) => ({ ...current, takeProfitPercent }))
            }
            testId="strategy-take-profit-input"
          />
        </div>
        <label className="block space-y-1 text-sm text-slate-300">
          <span>Strategy parameters (JSON object)</span>
          <textarea
            value={configuration.parametersText}
            onChange={(event) =>
              setConfiguration((current) => ({
                ...current,
                parametersText: event.target.value,
              }))
            }
            required
            rows={4}
            spellCheck={false}
            data-testid="strategy-parameters-input"
            className="w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2 font-mono text-sm"
          />
        </label>
        <button
          type="submit"
          disabled={busy}
          data-testid="create-strategy-button"
          className="rounded-lg bg-white px-4 py-2 text-sm font-medium text-black disabled:opacity-50"
        >
          Create strategy
        </button>
      </form>

      <StrategyListView
        strategies={strategies}
        busy={busy}
        editingId={editingId}
        editName={editName}
        editDescription={editDescription}
        editStatus={editStatus}
        editConfiguration={editConfiguration}
        onEditName={setEditName}
        onEditDescription={setEditDescription}
        onEditStatus={setEditStatus}
        onEditConfiguration={setEditConfiguration}
        onStartEdit={startEdit}
        onCancelEdit={() => setEditingId(null)}
        onSaveEdit={onSaveEdit}
        onDelete={onDelete}
      />
    </section>
  );
}

export function StrategyListView({
  strategies,
  busy,
  editingId,
  editName,
  editDescription,
  editStatus,
  editConfiguration,
  onEditName,
  onEditDescription,
  onEditStatus,
  onEditConfiguration,
  onStartEdit,
  onCancelEdit,
  onSaveEdit,
  onDelete,
}: {
  strategies: Strategy[];
  busy: boolean;
  editingId: string | null;
  editName: string;
  editDescription: string;
  editStatus: StrategyStatus;
  editConfiguration: StrategyConfigurationDraft;
  onEditName: (value: string) => void;
  onEditDescription: (value: string) => void;
  onEditStatus: (value: StrategyStatus) => void;
  onEditConfiguration: (value: StrategyConfigurationDraft) => void;
  onStartEdit: (strategy: Strategy) => void;
  onCancelEdit: () => void;
  onSaveEdit: (event: FormEvent) => void;
  onDelete: (id: string) => void;
}) {
  return (
    <ul className="space-y-3" data-testid="strategy-list">
      {strategies.map((strategy) => (
        <li
          key={strategy.id}
          data-testid="strategy-item"
          className="rounded-xl border border-white/10 bg-white/5 px-4 py-4"
        >
          {editingId === strategy.id ? (
            <form onSubmit={onSaveEdit} className="space-y-3" data-testid="edit-strategy-form">
              <input
                value={editName}
                onChange={(e) => onEditName(e.target.value)}
                required
                maxLength={200}
                data-testid="edit-name-input"
                className="w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm"
              />
              <textarea
                value={editDescription}
                onChange={(e) => onEditDescription(e.target.value)}
                maxLength={2000}
                rows={2}
                data-testid="edit-description-input"
                className="w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm"
              />
              <select
                value={editStatus}
                onChange={(e) => onEditStatus(e.target.value as StrategyStatus)}
                data-testid="edit-status-select"
                className="rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm"
              >
                {STATUS_OPTIONS.map((status) => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}
              </select>
              <div className="grid gap-3 sm:grid-cols-3">
                <label className="space-y-1 text-sm text-slate-300">
                  <span>Trading pair</span>
                  <input
                    value={editConfiguration.tradingPair}
                    onChange={(event) =>
                      onEditConfiguration({
                        ...editConfiguration,
                        tradingPair: event.target.value.toUpperCase(),
                      })
                    }
                    required
                    pattern="[A-Z0-9]+"
                    data-testid="edit-trading-pair-input"
                    className="w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2"
                  />
                </label>
                <label className="space-y-1 text-sm text-slate-300">
                  <span>Timeframe</span>
                  <select
                    value={editConfiguration.timeframe}
                    onChange={(event) =>
                      onEditConfiguration({
                        ...editConfiguration,
                        timeframe: event.target.value as StrategyTimeframe,
                      })
                    }
                    data-testid="edit-timeframe-select"
                    className="w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2"
                  >
                    {TIMEFRAME_OPTIONS.map((timeframe) => (
                      <option key={timeframe}>{timeframe}</option>
                    ))}
                  </select>
                </label>
                <label className="space-y-1 text-sm text-slate-300">
                  <span>Direction</span>
                  <select
                    value={editConfiguration.direction}
                    onChange={(event) =>
                      onEditConfiguration({
                        ...editConfiguration,
                        direction: event.target.value as StrategyDirection,
                      })
                    }
                    data-testid="edit-direction-select"
                    className="w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2"
                  >
                    {DIRECTION_OPTIONS.map((direction) => (
                      <option key={direction}>{direction}</option>
                    ))}
                  </select>
                </label>
              </div>
              <div className="grid gap-3 sm:grid-cols-3">
                <NumberField
                  label="Position size"
                  value={editConfiguration.positionSize}
                  min={0.00000001}
                  onChange={(positionSize) =>
                    onEditConfiguration({ ...editConfiguration, positionSize })
                  }
                  testId="edit-position-size-input"
                />
                <NumberField
                  label="Stop loss %"
                  value={editConfiguration.stopLossPercent}
                  min={0}
                  max={100}
                  onChange={(stopLossPercent) =>
                    onEditConfiguration({ ...editConfiguration, stopLossPercent })
                  }
                  testId="edit-stop-loss-input"
                />
                <NumberField
                  label="Take profit %"
                  value={editConfiguration.takeProfitPercent}
                  min={0}
                  max={100}
                  onChange={(takeProfitPercent) =>
                    onEditConfiguration({ ...editConfiguration, takeProfitPercent })
                  }
                  testId="edit-take-profit-input"
                />
              </div>
              <label className="block space-y-1 text-sm text-slate-300">
                <span>Strategy parameters (JSON object)</span>
                <textarea
                  value={editConfiguration.parametersText}
                  onChange={(event) =>
                    onEditConfiguration({
                      ...editConfiguration,
                      parametersText: event.target.value,
                    })
                  }
                  required
                  rows={4}
                  spellCheck={false}
                  data-testid="edit-parameters-input"
                  className="w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2 font-mono text-sm"
                />
              </label>
              <div className="flex gap-2">
                <button
                  type="submit"
                  disabled={busy}
                  data-testid="save-strategy-button"
                  className="rounded-lg bg-white px-3 py-1.5 text-sm font-medium text-black disabled:opacity-50"
                >
                  Save
                </button>
                <button
                  type="button"
                  onClick={onCancelEdit}
                  className="rounded-lg border border-white/10 px-3 py-1.5 text-sm text-slate-300"
                >
                  Cancel
                </button>
              </div>
            </form>
          ) : (
            <>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h3 className="font-medium">{strategy.name}</h3>
                <span
                  className={`rounded-full border px-2 py-0.5 text-xs ${statusColor(strategy.status)}`}
                >
                  {strategy.status}
                </span>
              </div>
              {strategy.description && (
                <p className="mt-1 text-sm text-slate-400">{strategy.description}</p>
              )}
              <dl className="mt-3 grid gap-2 text-xs text-slate-400 sm:grid-cols-3">
                <div>
                  <dt className="text-slate-500">Market</dt>
                  <dd>
                    {strategy.tradingPair} · {strategy.timeframe} · {strategy.direction}
                  </dd>
                </div>
                <div>
                  <dt className="text-slate-500">Position size</dt>
                  <dd>{strategy.positionSize}</dd>
                </div>
                <div>
                  <dt className="text-slate-500">Risk</dt>
                  <dd>
                    SL {strategy.stopLossPercent}% · TP {strategy.takeProfitPercent}%
                  </dd>
                </div>
              </dl>
              <pre className="mt-3 overflow-x-auto rounded-lg bg-black/20 p-3 text-xs text-slate-400">
                {JSON.stringify(strategy.parameters, null, 2)}
              </pre>
              <div className="mt-3 flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => onStartEdit(strategy)}
                  disabled={busy}
                  data-testid="edit-strategy-button"
                  className="rounded-lg border border-white/10 px-3 py-1.5 text-sm text-slate-300 disabled:opacity-50"
                >
                  Edit
                </button>
                <button
                  type="button"
                  onClick={() => onDelete(strategy.id)}
                  disabled={busy}
                  data-testid="delete-strategy-button"
                  className="rounded-lg border border-red-500/40 px-3 py-1.5 text-sm text-red-200 disabled:opacity-50"
                >
                  Delete
                </button>
              </div>
            </>
          )}
        </li>
      ))}
      {strategies.length === 0 && <p className="text-sm text-slate-500">No strategies yet.</p>}
    </ul>
  );
}

function NumberField({
  label,
  value,
  min,
  max,
  onChange,
  testId,
}: {
  label: string;
  value: number;
  min: number;
  max?: number;
  onChange: (value: number) => void;
  testId: string;
}) {
  return (
    <label className="space-y-1 text-sm text-slate-300">
      <span>{label}</span>
      <input
        type="number"
        value={value}
        min={min}
        max={max}
        step="any"
        required
        onChange={(event) => onChange(Number(event.target.value))}
        data-testid={testId}
        className="w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2"
      />
    </label>
  );
}

export function parseParameters(value: string): Record<string, unknown> {
  let parsed: unknown;
  try {
    parsed = JSON.parse(value);
  } catch {
    throw new Error('Parameters must be valid JSON');
  }
  if (parsed === null || Array.isArray(parsed) || typeof parsed !== 'object') {
    throw new Error('Parameters must be a JSON object');
  }
  return parsed as Record<string, unknown>;
}
