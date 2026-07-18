import { renderToStaticMarkup } from 'react-dom/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../shared/api', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../shared/api')>();
  return {
    statusColor: actual.statusColor,
    api: {
      listStrategies: vi.fn(),
      createStrategy: vi.fn(),
      updateStrategy: vi.fn(),
      deleteStrategy: vi.fn(),
    },
  };
});

import { WorkspaceProvider } from '../app/WorkspaceContext';
import { setActiveWorkspace } from '../shared/auth';
import type { Strategy } from '../shared/api';
import {
  parseParameters,
  StrategiesPage,
  StrategyListView,
  type StrategyConfigurationDraft,
} from './StrategiesPage';

function createMemoryStorage(): Storage {
  const store = new Map<string, string>();
  return {
    get length() {
      return store.size;
    },
    clear: () => store.clear(),
    getItem: (key) => store.get(key) ?? null,
    key: (index) => [...store.keys()][index] ?? null,
    removeItem: (key) => store.delete(key),
    setItem: (key, value) => store.set(key, String(value)),
  };
}

const strategies: Strategy[] = [
  {
    id: 'st-1',
    workspaceId: 'ws-1',
    name: 'Momentum',
    description: 'Breakout idea',
    status: 'draft',
    tradingPair: 'BTCUSDT',
    timeframe: '1h',
    direction: 'BOTH',
    positionSize: 100,
    stopLossPercent: 2,
    takeProfitPercent: 5,
    parameters: { emaFast: 20, emaSlow: 50 },
    createdAt: '2026-07-18T12:00:00.000Z',
    updatedAt: '2026-07-18T12:00:00.000Z',
  },
  {
    id: 'st-2',
    workspaceId: 'ws-1',
    name: 'Mean Reversion',
    description: '',
    status: 'active',
    tradingPair: 'ETHUSDT',
    timeframe: '15m',
    direction: 'LONG',
    positionSize: 50,
    stopLossPercent: 1,
    takeProfitPercent: 3,
    parameters: { rsi: 14 },
    createdAt: '2026-07-18T13:00:00.000Z',
    updatedAt: '2026-07-18T13:30:00.000Z',
  },
];

const noop = () => undefined;
const editConfiguration: StrategyConfigurationDraft = {
  tradingPair: 'BTCUSDT',
  timeframe: '1h',
  direction: 'BOTH',
  positionSize: 100,
  stopLossPercent: 2,
  takeProfitPercent: 5,
  parametersText: '{"emaFast":20}',
};

describe('StrategiesPage (US004/US005)', () => {
  beforeEach(() => {
    Object.defineProperty(globalThis, 'localStorage', {
      configurable: true,
      value: createMemoryStorage(),
    });
    setActiveWorkspace({ id: 'ws-1', name: 'Default Workspace' });
  });

  it('renders inside WorkspaceContext with the create form and empty state', () => {
    const html = renderToStaticMarkup(
      <WorkspaceProvider>
        <StrategiesPage />
      </WorkspaceProvider>,
    );

    expect(html).toContain('data-testid="strategies-page"');
    expect(html).toContain('Default Workspace');
    expect(html).toContain('data-testid="create-strategy-form"');
    expect(html).toContain('data-testid="strategy-name-input"');
    expect(html).toContain('data-testid="strategy-trading-pair-input"');
    expect(html).toContain('data-testid="strategy-timeframe-select"');
    expect(html).toContain('data-testid="strategy-direction-select"');
    expect(html).toContain('data-testid="strategy-position-size-input"');
    expect(html).toContain('data-testid="strategy-stop-loss-input"');
    expect(html).toContain('data-testid="strategy-take-profit-input"');
    expect(html).toContain('data-testid="strategy-parameters-input"');
    expect(html).toContain('data-testid="create-strategy-button"');
    expect(html).toContain('No strategies yet.');
  });

  it('renders strategy rows with status badges and actions', () => {
    const html = renderToStaticMarkup(
      <StrategyListView
        strategies={strategies}
        busy={false}
        editingId={null}
        editName=""
        editDescription=""
        editStatus="draft"
        editConfiguration={editConfiguration}
        onEditName={noop}
        onEditDescription={noop}
        onEditStatus={noop}
        onEditConfiguration={noop}
        onStartEdit={noop}
        onCancelEdit={noop}
        onSaveEdit={noop}
        onDelete={noop}
      />,
    );

    expect(html).toContain('Momentum');
    expect(html).toContain('Breakout idea');
    expect(html).toContain('Mean Reversion');
    expect(html).toContain('draft');
    expect(html).toContain('active');
    expect(html).toContain('BTCUSDT');
    expect(html).toContain('ETHUSDT');
    expect(html).toContain('emaFast');
    expect(html).toContain('data-testid="edit-strategy-button"');
    expect(html).toContain('data-testid="delete-strategy-button"');
    expect(html).not.toContain('No strategies yet.');
  });

  it('renders the inline edit form for the strategy being edited', () => {
    const html = renderToStaticMarkup(
      <StrategyListView
        strategies={strategies}
        busy={false}
        editingId="st-1"
        editName="Momentum v2"
        editDescription="Updated"
        editStatus="active"
        editConfiguration={editConfiguration}
        onEditName={noop}
        onEditDescription={noop}
        onEditStatus={noop}
        onEditConfiguration={noop}
        onStartEdit={noop}
        onCancelEdit={noop}
        onSaveEdit={noop}
        onDelete={noop}
      />,
    );

    expect(html).toContain('data-testid="edit-strategy-form"');
    expect(html).toContain('Momentum v2');
    expect(html).toContain('data-testid="edit-status-select"');
    expect(html).toContain('data-testid="edit-trading-pair-input"');
    expect(html).toContain('data-testid="edit-timeframe-select"');
    expect(html).toContain('data-testid="edit-direction-select"');
    expect(html).toContain('data-testid="edit-parameters-input"');
    expect(html).toContain('data-testid="save-strategy-button"');
    expect(html).toContain('Mean Reversion');
  });

  it('accepts JSON objects and rejects malformed or non-object parameters', () => {
    expect(parseParameters('{"emaFast":20}')).toEqual({ emaFast: 20 });
    expect(() => parseParameters('{')).toThrow('Parameters must be valid JSON');
    expect(() => parseParameters('[1,2]')).toThrow('Parameters must be a JSON object');
  });
});
