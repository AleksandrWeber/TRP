import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useWorkspace } from '../app/WorkspaceContext';
import { api, type StrategyLibraryRecordView } from '../shared/api';
import { toUserFacingError } from '../shared/mapApiError';
import { DeploymentWizardView } from './DeploymentWizardView';
import {
  buildCreateDeploymentRequest,
  draftFromEntry,
  nextWizardStep,
  previousWizardStep,
  type DeploymentWizardDraft,
  type DeploymentWizardStep,
} from './deployment-wizard';

const INITIAL_DRAFT: DeploymentWizardDraft = {
  entry: null,
  instrument: '',
  timeframe: '',
  notes: '',
};

export function DeploymentWizardPage() {
  const { activeWorkspace } = useWorkspace();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [step, setStep] = useState<DeploymentWizardStep>('version');
  const [draft, setDraft] = useState<DeploymentWizardDraft>(INITIAL_DRAFT);
  const [entries, setEntries] = useState<StrategyLibraryRecordView[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    api
      .listStrategyLibrary({ limit: 200 })
      .then((page) => {
        if (cancelled) return;
        setEntries(page.items);
        const libraryEntryId = searchParams.get('libraryEntryId');
        if (libraryEntryId) {
          const match = page.items.find((item) => item.version.libraryEntryId === libraryEntryId);
          if (match) setDraft((current) => ({ ...current, ...draftFromEntry(match) }));
        }
      })
      .catch((err: unknown) => {
        if (!cancelled) setError(toUserFacingError(err, 'Could not load Strategy Library.'));
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
      const created = await api.createStrategyDeployment(
        buildCreateDeploymentRequest(draft),
        crypto.randomUUID(),
      );
      navigate(`/deployments/${created.id}`);
    } catch (err: unknown) {
      setError(toUserFacingError(err, 'Could not create Deployment.'));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <DeploymentWizardView
      step={step}
      draft={draft}
      entries={entries}
      loading={loading}
      submitting={submitting}
      error={error}
      onSelect={(entry) => setDraft((current) => ({ ...current, ...draftFromEntry(entry) }))}
      onInstrument={(instrument) => setDraft((current) => ({ ...current, instrument }))}
      onTimeframe={(timeframe) => setDraft((current) => ({ ...current, timeframe }))}
      onNotes={(notes) => setDraft((current) => ({ ...current, notes }))}
      onBack={() => setStep((current) => previousWizardStep(current))}
      onNext={() => setStep((current) => nextWizardStep(current))}
      onSubmit={() => void onSubmit()}
    />
  );
}
