import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import type { TradingSessionBotView } from '../shared/api';
import { FleetNavigationBar } from './components/FleetNavigationBar';
import {
  DEFAULT_FLEET_NAVIGATION,
  matchesFleetSearch,
  navigateFleet,
  resolveFleetEmptyReason,
  selectForInspector,
  toggleSelection,
  type FleetNavigationState,
} from './fleet-navigation';
import { ActiveSessionsPanel } from './panels/ActiveSessionsPanel';
import { BotOverviewPanel } from './panels/BotOverviewPanel';
import { SessionDetailInspectorPanel } from './panels/SessionDetailInspectorPanel';

const bots: TradingSessionBotView[] = [
  {
    id: 'bot-alpha',
    tradingSessionId: 'bot-alpha',
    workspaceId: 'ws-1',
    exchangeScopeId: 'exchange-scope:binance',
    paperAccountId: 'acct-1',
    status: 'running',
    state: 'running',
    mission: { deploymentId: 'dep-1' },
    origin: 'manual',
    version: 1,
    failureReason: null,
    createdAt: '2026-08-10T11:00:00.000Z',
    recordedAt: '2026-08-10T11:00:00.000Z',
    actorId: 'user-1',
    correlationId: null,
    leaseOwnerId: 'runtime-1',
    fencingToken: 1,
  },
  {
    id: 'bot-beta',
    tradingSessionId: 'bot-beta',
    workspaceId: 'ws-1',
    exchangeScopeId: 'exchange-scope:binance',
    paperAccountId: 'acct-2',
    status: 'paused',
    state: 'paused',
    mission: { deploymentId: 'dep-2' },
    origin: 'manual',
    version: 2,
    failureReason: null,
    createdAt: '2026-08-10T10:00:00.000Z',
    recordedAt: '2026-08-10T10:30:00.000Z',
    actorId: 'user-1',
    correlationId: null,
    leaseOwnerId: 'runtime-2',
    fencingToken: 2,
  },
  {
    id: 'bot-gamma',
    tradingSessionId: 'bot-gamma',
    workspaceId: 'ws-1',
    exchangeScopeId: 'exchange-scope:okx',
    paperAccountId: 'acct-3',
    status: 'running',
    state: 'running',
    mission: { deploymentId: 'dep-3' },
    origin: 'manual',
    version: 1,
    failureReason: null,
    createdAt: '2026-08-10T09:00:00.000Z',
    recordedAt: '2026-08-10T09:00:00.000Z',
    actorId: 'user-1',
    correlationId: null,
    leaseOwnerId: 'runtime-3',
    fencingToken: 3,
  },
];

describe('Command Center operational navigation (RC-20 Epic 4)', () => {
  it('searches by bot name/id, trading session, and exchange scope', () => {
    expect(matchesFleetSearch(bots[0]!, 'alpha')).toBe(true);
    expect(matchesFleetSearch(bots[0]!, 'bot-alpha')).toBe(true);
    expect(matchesFleetSearch(bots[0]!, 'exchange-scope:binance')).toBe(true);
    expect(matchesFleetSearch(bots[0]!, 'okx')).toBe(false);

    const found = navigateFleet(bots, { ...DEFAULT_FLEET_NAVIGATION, search: 'okx' });
    expect(found.map((bot) => bot.id)).toEqual(['bot-gamma']);
  });

  it('filters by exchange and status', () => {
    const byExchange = navigateFleet(bots, {
      ...DEFAULT_FLEET_NAVIGATION,
      exchangeFilter: 'exchange-scope:binance',
    });
    expect(byExchange.map((bot) => bot.id)).toEqual(['bot-alpha', 'bot-beta']);

    const byStatus = navigateFleet(bots, {
      ...DEFAULT_FLEET_NAVIGATION,
      statusFilter: 'paused',
    });
    expect(byStatus.map((bot) => bot.id)).toEqual(['bot-beta']);
  });

  it('sorts by name, status, and exchange', () => {
    const byNameDesc = navigateFleet(bots, {
      ...DEFAULT_FLEET_NAVIGATION,
      sortField: 'name',
      sortDirection: 'desc',
    });
    expect(byNameDesc.map((bot) => bot.id)).toEqual(['bot-gamma', 'bot-beta', 'bot-alpha']);

    const byStatus = navigateFleet(bots, {
      ...DEFAULT_FLEET_NAVIGATION,
      sortField: 'status',
      sortDirection: 'asc',
    });
    expect(byStatus.map((bot) => bot.status)).toEqual(['paused', 'running', 'running']);

    const byExchange = navigateFleet(bots, {
      ...DEFAULT_FLEET_NAVIGATION,
      sortField: 'exchange',
      sortDirection: 'asc',
    });
    expect(byExchange[0]?.exchangeScopeId).toBe('exchange-scope:binance');
    expect(byExchange[byExchange.length - 1]?.exchangeScopeId).toBe('exchange-scope:okx');
  });

  it('supports multi-selection without bulk commands', () => {
    let selected = toggleSelection([], 'bot-alpha');
    selected = toggleSelection(selected, 'bot-beta');
    expect(selected).toEqual(['bot-alpha', 'bot-beta']);
    selected = toggleSelection(selected, 'bot-alpha');
    expect(selected).toEqual(['bot-beta']);

    const focused = selectForInspector(['bot-beta'], 'bot-gamma');
    expect(focused.focusedId).toBe('bot-gamma');
    expect(focused.selectedIds).toEqual(['bot-beta', 'bot-gamma']);
  });

  it('updates inspector from focused selection', () => {
    const focused = bots[1]!;
    const html = renderToStaticMarkup(
      <SessionDetailInspectorPanel presentation="ready" session={focused} />,
    );
    expect(html).toContain('bot-beta');
    expect(html).toContain('paused');
    expect(html).toContain('exchange-scope:binance');
  });

  it('renders navigation toolbar and filtered empty states', () => {
    const nav: FleetNavigationState = {
      ...DEFAULT_FLEET_NAVIGATION,
      search: 'missing',
    };
    const toolbar = renderToStaticMarkup(
      <FleetNavigationBar
        navigation={nav}
        exchangeOptions={['exchange-scope:binance']}
        statusOptions={['running', 'paused']}
        selectedCount={2}
        onChange={() => undefined}
        onClearSelection={() => undefined}
      />,
    );
    expect(toolbar).toContain('data-testid="cc-fleet-search"');
    expect(toolbar).toContain('data-testid="cc-fleet-filter-exchange"');
    expect(toolbar).toContain('data-testid="cc-fleet-filter-status"');
    expect(toolbar).toContain('data-testid="cc-fleet-sort-field"');
    expect(toolbar).toContain('Clear selection (2)');

    expect(resolveFleetEmptyReason(3, 0)).toBe('no-matches');
    expect(resolveFleetEmptyReason(0, 0)).toBe('no-sessions');

    const empty = renderToStaticMarkup(
      <BotOverviewPanel presentation="empty" emptyReason="no-matches" />,
    );
    expect(empty).toContain('No matching results');

    const sessionsEmpty = renderToStaticMarkup(
      <ActiveSessionsPanel presentation="empty" emptyReason="no-matches" />,
    );
    expect(sessionsEmpty).toContain('No matching results');
  });

  it('keeps lifecycle commands available on filtered rows', () => {
    const html = renderToStaticMarkup(
      <ActiveSessionsPanel
        presentation="ready"
        sessions={[bots[0]!]}
        selectedIds={[bots[0]!.id]}
        focusedId={bots[0]!.id}
      />,
    );
    expect(html).toContain('data-testid="cc-pause-bot-alpha"');
    expect(html).toContain('data-testid="cc-session-check-bot-alpha"');
    expect(html).not.toContain('Kill Switch');
    expect(html).not.toContain('Bulk');
  });
});
