import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useWorkspace } from '../app/WorkspaceContext';
import { api, type StrategyDeploymentView, type StrategyLibraryRecordView } from '../shared/api';
import { toUserFacingError } from '../shared/mapApiError';
import { OrchestratorWizardView } from './OrchestratorWizardView';
import {
  approvedDeployments,
  buildCreatePlanRequest,
  buildEmitHandoffBody,
  buildProposeSelectionBody,
  buildRequestRunBody,
  draftFromDeployment,
  draftFromEntry,
  INITIAL_ORCHESTRATOR_DRAFT,
  nextOrchestratorStep,
  previousOrchestratorStep,
  type OrchestratorProgress,
  type OrchestratorWizardDraft,
  type OrchestratorWizardStep,
} from './orchestration-wizard';

export function OrchestratorWizardPage() {
  const { activeWorkspace } = useWorkspace();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [step, setStep] = useState<OrchestratorWizardStep>('plan');
  const [draft, setDraft] = useState<OrchestratorWizardDraft>(INITIAL_ORCHESTRATOR_DRAFT);
  const [entries, setEntries] = useState<StrategyLibraryRecordView[]>([]);
  const [deployments, setDeployments] = useState<StrategyDeploymentView[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [progress, setProgress] = useState<OrchestratorProgress | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    Promise.all([api.listStrategyLibrary({ limit: 200 }), api.listStrategyDeployments()])
      .then(([page, listed]) => {
        if (cancelled) return;
        setEntries(page.items);
        const approved = approvedDeployments(listed);
        setDeployments(approved);
        const libraryEntryId = searchParams.get('libraryEntryId');
        const deploymentId = searchParams.get('deploymentId');
        setDraft((current) => {
          let next = current;
          if (libraryEntryId) {
            const match = page.items.find((item) => item.version.libraryEntryId === libraryEntryId);
            if (match) next = draftFromEntry(next, match);
          }
          if (deploymentId) {
            const match = approved.find((item) => item.id === deploymentId);
            if (match) next = draftFromDeployment(next, match);
          }
          return next;
        });
      })
      .catch((err: unknown) => {
        if (!cancelled) setError(toUserFacingError(err, 'Could not load orchestration inputs.'));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [activeWorkspace.id, searchParams]);

  async function onSubmit() {
    setSubmitting(true);
    setError(null);
    try {
      setProgress('plan');
      const plan = await api.createOrchestrationPlan(buildCreatePlanRequest(draft));
      setProgress('run');
      const requested = await api.requestOrchestrationRun(
        buildRequestRunBody(draft, plan.orchestrationPlanId),
      );
      setProgress('selection');
      const proposed = await api.proposeOrchestrationSelection(
        requested.orchestrationRunId,
        buildProposeSelectionBody(draft),
      );
      setProgress('handoff');
      const handed = await api.emitOrchestrationHandoff(
        requested.orchestrationRunId,
        buildEmitHandoffBody(proposed.selectionDecisionId ?? '', draft.deployment?.id ?? ''),
      );
      setProgress('complete');
      navigate(`/orchestrator/runs/${handed.orchestrationRunId}`);
    } catch (err: unknown) {
      setError(toUserFacingError(err, 'Could not complete orchestration.'));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <OrchestratorWizardView
      step={step}
      draft={draft}
      entries={entries}
      deployments={deployments}
      loading={loading}
      submitting={submitting}
      progress={progress}
      error={error}
      onMarketSymbol={(marketSymbol) => setDraft((current) => ({ ...current, marketSymbol }))}
      onExchangeScope={(exchangeScopeId) =>
        setDraft((current) => ({ ...current, exchangeScopeId }))
      }
      onObjective={(objective) => setDraft((current) => ({ ...current, objective }))}
      onSelectEntry={(entry) => setDraft((current) => draftFromEntry(current, entry))}
      onSelectDeployment={(deployment) =>
        setDraft((current) => draftFromDeployment(current, deployment))
      }
      onTimeframe={(timeframe) => setDraft((current) => ({ ...current, timeframe }))}
      onBack={() => setStep((current) => previousOrchestratorStep(current))}
      onNext={() => setStep((current) => nextOrchestratorStep(current))}
      onSubmit={() => void onSubmit()}
    />
  );
}
