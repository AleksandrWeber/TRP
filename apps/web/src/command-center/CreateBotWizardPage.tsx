import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useWorkspace } from '../app/WorkspaceContext';
import { api, type StrategyDeploymentView } from '../shared/api';
import { toUserFacingError } from '../shared/mapApiError';
import { CreateBotWizardView } from './CreateBotWizardView';
import { loadOrchestrationReference } from './orchestration-reference';
import {
  approvedDeployments,
  buildCreatePaperAccountRequest,
  buildCreateTradingSessionRequest,
  INITIAL_CREATE_BOT_DRAFT,
  nextCreateBotStep,
  previousCreateBotStep,
  type CreateBotProgress,
  type CreateBotWizardDraft,
  type CreateBotWizardStep,
} from './create-bot-wizard';

export function CreateBotWizardPage() {
  const { activeWorkspace } = useWorkspace();
  const navigate = useNavigate();
  const [step, setStep] = useState<CreateBotWizardStep>('deployment');
  const [draft, setDraft] = useState<CreateBotWizardDraft>(INITIAL_CREATE_BOT_DRAFT);
  const [deployments, setDeployments] = useState<StrategyDeploymentView[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [progress, setProgress] = useState<CreateBotProgress | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    api
      .listStrategyDeployments()
      .then((listed) => {
        if (!cancelled) setDeployments(approvedDeployments(listed));
      })
      .catch((err: unknown) => {
        if (!cancelled) setError(toUserFacingError(err, 'Could not load approved Deployments.'));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [activeWorkspace.id]);

  async function onSubmit() {
    setSubmitting(true);
    setError(null);
    try {
      setProgress('account');
      const account = await api.createPaperAccount(buildCreatePaperAccountRequest(draft));
      setProgress('session');
      const handoff = draft.deployment
        ? await loadOrchestrationReference(
            draft.deployment.id,
            api.listOrchestrationRuns,
            api.getOrchestrationRun,
          ).catch(() => null)
        : null;
      const created = await api.createTradingSession(
        buildCreateTradingSessionRequest(draft, account.id, handoff?.sessionHandoffIntentId),
      );
      setProgress('start');
      const started = await api.startTradingSession(created.id);
      setProgress('complete');
      navigate(`/command-center/sessions/${started.id}`);
    } catch (err: unknown) {
      setError(toUserFacingError(err, 'Could not create the paper bot.'));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <CreateBotWizardView
      step={step}
      draft={draft}
      deployments={deployments}
      loading={loading}
      submitting={submitting}
      progress={progress}
      error={error}
      onSelectDeployment={(deployment) => setDraft((current) => ({ ...current, deployment }))}
      onCurrency={(currency) => setDraft((current) => ({ ...current, currency }))}
      onOpeningCapital={(openingCapital) => setDraft((current) => ({ ...current, openingCapital }))}
      onBack={() => setStep((current) => previousCreateBotStep(current))}
      onNext={() => setStep((current) => nextCreateBotStep(current))}
      onSubmit={() => void onSubmit()}
    />
  );
}
