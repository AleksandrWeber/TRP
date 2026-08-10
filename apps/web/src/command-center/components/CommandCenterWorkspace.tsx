import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  api,
  type ExchangeScopeOverviewView,
  type ExchangeStatusView,
  type PaperSessionView,
  type RuntimeHealthView,
  type TradingSessionBotView,
} from '../../shared/api';
import { ConfirmationDialog } from '../../shared/ConfirmationDialog';
import { ActiveSessionsPanel } from '../panels/ActiveSessionsPanel';
import { BotOverviewPanel } from '../panels/BotOverviewPanel';
import { EmergencyControlsPanel } from '../panels/EmergencyControlsPanel';
import { ExchangeOverviewPanel } from '../panels/ExchangeOverviewPanel';
import { GlobalSystemStatusPanel } from '../panels/GlobalSystemStatusPanel';
import { RunningPaperTradingPanel } from '../panels/RunningPaperTradingPanel';
import { SessionDetailInspectorPanel } from '../panels/SessionDetailInspectorPanel';
import {
  DEFAULT_FLEET_NAVIGATION,
  navigateFleet,
  resolveFleetEmptyReason,
  selectForInspector,
  toggleSelection,
  uniqueExchangeScopes,
  uniqueStatuses,
  type FleetNavigationState,
} from '../fleet-navigation';
import {
  isActiveSession,
  isRunningPaperSession,
  loadCommandCenterProjections,
  type CommandCenterProjectionErrors,
} from '../load-projections';
import {
  classifyOperatorError,
  isPartialProjectionFailure,
  isTotalProjectionFailure,
  lifecycleErrorNotification,
  lifecycleSuccessNotification,
  manualRefreshSuccessNotification,
  partialRefreshWarningNotification,
  projectionFailureLabels,
  sessionUnavailableWarningNotification,
} from '../notifications';
import {
  dialogCopy,
  executeSessionLifecycleCommand,
  type SessionLifecycleAction,
} from '../session-commands';
import type { PanelPresentation } from '../types';
import { useOperatorNotifications } from '../use-operator-notifications';
import { CommandCenterFooter } from './CommandCenterFooter';
import { CommandCenterTopBar } from './CommandCenterTopBar';
import { FleetNavigationBar } from './FleetNavigationBar';
import { NotificationCenter } from './NotificationCenter';

type LoadState = 'loading' | 'ready';

type PendingCommand = {
  action: SessionLifecycleAction;
  sessionId: string;
};

/**
 * Main workspace layout per RC-20 UI Contract Part A.
 * Epic 5: operator notifications reflect completed backend / refresh outcomes.
 */
export function CommandCenterWorkspace() {
  const [loadState, setLoadState] = useState<LoadState>('loading');
  const [health, setHealth] = useState<RuntimeHealthView | null>(null);
  const [bots, setBots] = useState<TradingSessionBotView[]>([]);
  const [paperSessions, setPaperSessions] = useState<PaperSessionView[]>([]);
  const [exchangeStatus, setExchangeStatus] = useState<ExchangeStatusView | null>(null);
  const [exchangeScope, setExchangeScope] = useState<ExchangeScopeOverviewView | null>(null);
  const [errors, setErrors] = useState<CommandCenterProjectionErrors>({
    health: null,
    bots: null,
    paperSessions: null,
    exchangeStatus: null,
    exchangeScope: null,
  });
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [focusedId, setFocusedId] = useState<string | null>(null);
  const [navigation, setNavigation] = useState<FleetNavigationState>(DEFAULT_FLEET_NAVIGATION);
  const [lastRefreshedAt, setLastRefreshedAt] = useState<string | null>(null);
  const [pending, setPending] = useState<PendingCommand | null>(null);
  const [commandBusy, setCommandBusy] = useState(false);
  const { notifications, push, dismiss } = useOperatorNotifications();

  const refresh = useCallback(
    async (options?: { notify?: boolean }) => {
      const notify = options?.notify === true;
      setLoadState('loading');
      const { data, errors: nextErrors } = await loadCommandCenterProjections({
        getRuntimeHealth: api.getRuntimeHealth,
        listTradingSessions: api.listTradingSessions,
        listPaperSessions: api.listPaperSessions,
        getExchangeStatus: api.getExchangeStatus,
        getDefaultExchangeScope: api.getDefaultExchangeScope,
      });
      setHealth(data.health);
      setBots(data.bots);
      setPaperSessions(data.paperSessions);
      setExchangeStatus(data.exchangeStatus);
      setExchangeScope(data.exchangeScope);
      setErrors(nextErrors);
      const available = new Set(data.bots.map((bot) => bot.id));
      setSelectedIds((current) => current.filter((id) => available.has(id)));
      let droppedFocus: string | null = null;
      setFocusedId((current) => {
        if (current && !available.has(current)) {
          droppedFocus = current;
          return null;
        }
        return current && available.has(current) ? current : null;
      });
      if (notify && droppedFocus) {
        push(sessionUnavailableWarningNotification(droppedFocus));
      }
      if (!nextErrors.health || data.bots.length > 0 || data.paperSessions.length > 0) {
        setLastRefreshedAt(new Date().toISOString());
      }
      setLoadState('ready');

      if (!notify) return;

      if (isTotalProjectionFailure(nextErrors)) {
        push(
          classifyOperatorError(new Error('Backend unavailable: all projections failed'))
            .notification,
        );
        return;
      }
      if (isPartialProjectionFailure(nextErrors)) {
        push(partialRefreshWarningNotification(projectionFailureLabels(nextErrors)));
        return;
      }
      push(manualRefreshSuccessNotification());
    },
    [push],
  );

  useEffect(() => {
    void refresh({ notify: false });
  }, [refresh]);

  const requestAction = useCallback((action: SessionLifecycleAction, sessionId: string) => {
    setPending({ action, sessionId });
  }, []);

  const confirmAction = useCallback(async () => {
    if (!pending || commandBusy) return;
    const { action, sessionId } = pending;
    setCommandBusy(true);
    try {
      await executeSessionLifecycleCommand(
        {
          pauseTradingSession: api.pauseTradingSession,
          resumeTradingSession: api.resumeTradingSession,
          stopTradingSession: api.stopTradingSession,
        },
        action,
        sessionId,
      );
      setPending(null);
      await refresh({ notify: false });
      push(lifecycleSuccessNotification(action, sessionId));
    } catch (err) {
      push(lifecycleErrorNotification(action, sessionId, err));
    } finally {
      setCommandBusy(false);
    }
  }, [pending, commandBusy, refresh, push]);

  const visibleBots = useMemo(() => navigateFleet(bots, navigation), [bots, navigation]);
  const activeSessions = useMemo(
    () => visibleBots.filter((bot) => isActiveSession(bot.status)),
    [visibleBots],
  );
  const runningPaper = paperSessions.filter((session) => isRunningPaperSession(session.status));
  const selected = bots.find((bot) => bot.id === focusedId) ?? null;
  const botEmptyReason = resolveFleetEmptyReason(bots.length, visibleBots.length);
  const sessionEmptyReason = resolveFleetEmptyReason(
    bots.filter((bot) => isActiveSession(bot.status)).length,
    activeSessions.length,
  );
  const paperEngineStatus = errors.paperSessions
    ? 'unavailable'
    : loadState === 'ready'
      ? 'available'
      : null;
  const dialog = pending ? dialogCopy(pending.action, pending.sessionId) : null;

  const handleSelect = useCallback((id: string) => {
    setSelectedIds((current) => {
      const next = selectForInspector(current, id);
      setFocusedId(next.focusedId);
      return next.selectedIds;
    });
  }, []);

  const handleToggleSelect = useCallback((id: string) => {
    setSelectedIds((current) => {
      const next = toggleSelection(current, id);
      setFocusedId((focused) => {
        if (!next.includes(id) && focused === id) {
          return next[next.length - 1] ?? null;
        }
        return focused ?? id;
      });
      return next;
    });
  }, []);

  const clearSelection = useCallback(() => {
    setSelectedIds([]);
    setFocusedId(null);
  }, []);

  return (
    <div className="space-y-6" data-testid="cc-workspace">
      <NotificationCenter notifications={notifications} onDismiss={dismiss} />

      <CommandCenterTopBar
        onRefresh={() => void refresh({ notify: true })}
        refreshing={loadState === 'loading'}
      />

      <div className="space-y-4" data-testid="cc-status-area" aria-label="Status Area">
        <GlobalSystemStatusPanel
          presentation={panelPresentation({
            loading: loadState === 'loading' && !health,
            error: errors.health,
            empty: Boolean(health) && bots.length === 0 && !errors.bots,
            ready: Boolean(health),
          })}
          errorMessage={errors.health}
          health={health}
          bots={bots}
          paperEngineStatus={paperEngineStatus}
        />
      </div>

      <div className="space-y-4" data-testid="cc-operations-area" aria-label="Operations Area">
        <div className="grid gap-4 lg:grid-cols-2">
          <ExchangeOverviewPanel
            presentation={panelPresentation({
              loading: loadState === 'loading' && !exchangeScope,
              error: errors.exchangeScope ?? errors.exchangeStatus,
              empty: false,
              ready: Boolean(exchangeScope),
            })}
            errorMessage={errors.exchangeScope ?? errors.exchangeStatus}
            exchangeScope={exchangeScope}
            exchangeStatus={exchangeStatus}
          />
          <EmergencyControlsPanel presentation="ready" />
        </div>

        <FleetNavigationBar
          navigation={navigation}
          exchangeOptions={uniqueExchangeScopes(bots)}
          statusOptions={uniqueStatuses(bots)}
          selectedCount={selectedIds.length}
          onChange={setNavigation}
          onClearSelection={clearSelection}
        />

        <div className="grid gap-4 lg:grid-cols-2">
          <BotOverviewPanel
            presentation={panelPresentation({
              loading: loadState === 'loading' && bots.length === 0 && !errors.bots,
              error: errors.bots,
              empty: loadState === 'ready' && visibleBots.length === 0 && !errors.bots,
              ready: visibleBots.length > 0,
            })}
            errorMessage={errors.bots}
            bots={visibleBots}
            selectedIds={selectedIds}
            focusedId={focusedId}
            emptyReason={botEmptyReason}
            onSelect={handleSelect}
            onToggleSelect={handleToggleSelect}
          />
          <ActiveSessionsPanel
            presentation={panelPresentation({
              loading: loadState === 'loading' && bots.length === 0 && !errors.bots,
              error: errors.bots,
              empty: loadState === 'ready' && activeSessions.length === 0 && !errors.bots,
              ready: activeSessions.length > 0,
            })}
            errorMessage={errors.bots}
            sessions={activeSessions}
            selectedIds={selectedIds}
            focusedId={focusedId}
            emptyReason={sessionEmptyReason}
            onSelect={handleSelect}
            onToggleSelect={handleToggleSelect}
            onRequestAction={requestAction}
            commandsDisabled={commandBusy}
          />
        </div>

        <RunningPaperTradingPanel
          presentation={panelPresentation({
            loading: loadState === 'loading' && paperSessions.length === 0 && !errors.paperSessions,
            error: errors.paperSessions,
            empty: loadState === 'ready' && runningPaper.length === 0 && !errors.paperSessions,
            ready: runningPaper.length > 0,
          })}
          errorMessage={errors.paperSessions}
          sessions={runningPaper}
        />

        <div data-testid="cc-inspector-area" aria-label="Session detail inspector">
          <SessionDetailInspectorPanel
            presentation={selected ? 'ready' : 'empty'}
            session={selected}
            onClearSelection={clearSelection}
            onRequestAction={requestAction}
            commandsDisabled={commandBusy}
          />
        </div>
      </div>

      <CommandCenterFooter lastRefreshedAt={lastRefreshedAt} />

      {dialog && pending ? (
        <ConfirmationDialog
          open
          title={dialog.title}
          message={dialog.message}
          confirmLabel={commandBusy ? 'Working…' : dialog.confirmLabel}
          variant={dialog.variant}
          onConfirm={() => void confirmAction()}
          onCancel={() => {
            if (!commandBusy) setPending(null);
          }}
        />
      ) : null}
    </div>
  );
}

function panelPresentation(input: {
  loading: boolean;
  error: string | null;
  empty: boolean;
  ready: boolean;
}): PanelPresentation {
  if (input.loading) return 'loading';
  if (input.error) return 'error';
  if (input.ready) return 'ready';
  if (input.empty) return 'empty';
  return 'loading';
}

/** Presentational export for Epic 2 tests with injected projections. */
export type { CommandCenterProjectionErrors };
