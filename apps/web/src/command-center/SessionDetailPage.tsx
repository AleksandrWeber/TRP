import { useCallback, useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useWorkspace } from '../app/WorkspaceContext';
import { api, type TradingSessionBotView } from '../shared/api';
import { ConfirmationDialog } from '../shared/ConfirmationDialog';
import { toUserFacingError } from '../shared/mapApiError';
import {
  loadOrchestrationReference,
  type OrchestrationReferenceView,
} from './orchestration-reference';
import { SessionDetailView } from './SessionDetailView';
import {
  dialogCopy,
  executeSessionLifecycleCommand,
  type SessionLifecycleAction,
} from './session-commands';

export function SessionDetailPage() {
  const { sessionId = '' } = useParams();
  const { activeWorkspace } = useWorkspace();
  const [session, setSession] = useState<TradingSessionBotView | null>(null);
  const [orchestration, setOrchestration] = useState<OrchestrationReferenceView | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState<SessionLifecycleAction | null>(null);
  const [commandBusy, setCommandBusy] = useState(false);

  const refresh = useCallback(async () => {
    if (!sessionId) return;
    setLoading(true);
    setError(null);
    try {
      const next = await api.getTradingSession(sessionId);
      setSession(next);
      if (next.sessionHandoff?.sessionHandoffIntentId && next.sessionHandoff.orchestrationRunId) {
        setOrchestration({
          orchestrationRunId: next.sessionHandoff.orchestrationRunId,
          sessionHandoffIntentId: next.sessionHandoff.sessionHandoffIntentId,
          createsSession: false,
        });
      } else {
        const deploymentId = next.deploymentReference?.deploymentId ?? next.mission.deploymentId;
        const reference = await loadOrchestrationReference(
          deploymentId,
          api.listOrchestrationRuns,
          api.getOrchestrationRun,
        ).catch(() => null);
        setOrchestration(reference);
      }
    } catch (err: unknown) {
      setSession(null);
      setError(toUserFacingError(err, 'Could not load the Trading Session.'));
    } finally {
      setLoading(false);
    }
  }, [sessionId, activeWorkspace.id]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  async function confirmAction() {
    if (!pending || !sessionId || commandBusy) return;
    setCommandBusy(true);
    try {
      await executeSessionLifecycleCommand(
        {
          startTradingSession: api.startTradingSession,
          pauseTradingSession: api.pauseTradingSession,
          resumeTradingSession: api.resumeTradingSession,
          stopTradingSession: api.stopTradingSession,
        },
        pending,
        sessionId,
      );
      setPending(null);
      await refresh();
    } catch (err: unknown) {
      setError(toUserFacingError(err, `Could not ${pending} the session.`));
    } finally {
      setCommandBusy(false);
    }
  }

  const dialog = pending && sessionId ? dialogCopy(pending, sessionId) : null;

  return (
    <>
      <SessionDetailView
        session={session}
        loading={loading}
        error={error}
        orchestration={orchestration}
        commandsDisabled={commandBusy}
        onRequestAction={(action) => setPending(action)}
      />
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
    </>
  );
}
