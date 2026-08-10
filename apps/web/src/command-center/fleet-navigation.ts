import type { TradingSessionBotView } from '../shared/api';

export type FleetSortField = 'name' | 'status' | 'exchange';
export type FleetSortDirection = 'asc' | 'desc';

export type FleetNavigationState = {
  search: string;
  exchangeFilter: string; // '' = all
  statusFilter: string; // '' = all
  sortField: FleetSortField;
  sortDirection: FleetSortDirection;
};

export const DEFAULT_FLEET_NAVIGATION: FleetNavigationState = {
  search: '',
  exchangeFilter: '',
  statusFilter: '',
  sortField: 'name',
  sortDirection: 'asc',
};

export type FleetEmptyReason = 'none' | 'no-sessions' | 'no-matches';

/** Search matches Bot id/name, Trading Session id, and Exchange Scope. */
export function matchesFleetSearch(bot: TradingSessionBotView, search: string): boolean {
  const query = search.trim().toLowerCase();
  if (!query) return true;
  const haystack = [
    bot.id,
    bot.tradingSessionId,
    bot.exchangeScopeId,
    bot.paperAccountId,
    bot.mission.deploymentId,
    bot.status,
  ]
    .join(' ')
    .toLowerCase();
  return haystack.includes(query);
}

export function matchesFleetFilters(
  bot: TradingSessionBotView,
  navigation: Pick<FleetNavigationState, 'exchangeFilter' | 'statusFilter'>,
): boolean {
  if (navigation.exchangeFilter && bot.exchangeScopeId !== navigation.exchangeFilter) {
    return false;
  }
  if (
    navigation.statusFilter &&
    bot.status.toLowerCase() !== navigation.statusFilter.toLowerCase()
  ) {
    return false;
  }
  return true;
}

export function compareFleetBots(
  a: TradingSessionBotView,
  b: TradingSessionBotView,
  field: FleetSortField,
  direction: FleetSortDirection,
): number {
  const left = sortValue(a, field);
  const right = sortValue(b, field);
  const result = left.localeCompare(right, undefined, { sensitivity: 'base' });
  return direction === 'asc' ? result : -result;
}

function sortValue(bot: TradingSessionBotView, field: FleetSortField): string {
  if (field === 'status') return bot.status;
  if (field === 'exchange') return bot.exchangeScopeId;
  return bot.id;
}

/**
 * Applies client-side search, filters, and sorting over existing projections.
 * Does not mutate source arrays.
 */
export function navigateFleet(
  bots: readonly TradingSessionBotView[],
  navigation: FleetNavigationState,
): TradingSessionBotView[] {
  const filtered = bots.filter(
    (bot) => matchesFleetSearch(bot, navigation.search) && matchesFleetFilters(bot, navigation),
  );
  return [...filtered].sort((a, b) =>
    compareFleetBots(a, b, navigation.sortField, navigation.sortDirection),
  );
}

export function resolveFleetEmptyReason(
  sourceCount: number,
  visibleCount: number,
): FleetEmptyReason {
  if (sourceCount === 0) return 'no-sessions';
  if (visibleCount === 0) return 'no-matches';
  return 'none';
}

export function uniqueExchangeScopes(bots: readonly TradingSessionBotView[]): string[] {
  return [...new Set(bots.map((bot) => bot.exchangeScopeId))].sort((a, b) => a.localeCompare(b));
}

export function uniqueStatuses(bots: readonly TradingSessionBotView[]): string[] {
  return [...new Set(bots.map((bot) => bot.status.toLowerCase()))].sort((a, b) =>
    a.localeCompare(b),
  );
}

/** Toggle id in a multi-select list (UI-only). */
export function toggleSelection(selectedIds: readonly string[], id: string): string[] {
  return selectedIds.includes(id)
    ? selectedIds.filter((value) => value !== id)
    : [...selectedIds, id];
}

/**
 * Primary click: focus for inspector + ensure membership in selection.
 * Does not clear other selections (multi-select remains).
 */
export function selectForInspector(
  selectedIds: readonly string[],
  id: string,
): { selectedIds: string[]; focusedId: string } {
  return {
    focusedId: id,
    selectedIds: selectedIds.includes(id) ? [...selectedIds] : [...selectedIds, id],
  };
}

export function pruneSelection(
  selectedIds: readonly string[],
  focusedId: string | null,
  availableIds: ReadonlySet<string>,
): { selectedIds: string[]; focusedId: string | null } {
  const nextSelected = selectedIds.filter((id) => availableIds.has(id));
  const nextFocused =
    focusedId && availableIds.has(focusedId)
      ? focusedId
      : (nextSelected[nextSelected.length - 1] ?? null);
  return { selectedIds: nextSelected, focusedId: nextFocused };
}

export function fleetEmptyCopy(reason: FleetEmptyReason, context: 'bots' | 'sessions') {
  if (reason === 'no-matches') {
    return {
      title: 'No matching results',
      description:
        'No bots/sessions match the current search or filters. Clear search/filters to widen the list.',
    };
  }
  if (context === 'sessions') {
    return {
      title: 'No active sessions',
      description: 'Non-terminal sessions will appear here for operational focus.',
    };
  }
  return {
    title: 'No bots/sessions in this workspace',
    description:
      'Bots map 1:1 to Trading Sessions. Create or start a session to populate this fleet.',
  };
}
