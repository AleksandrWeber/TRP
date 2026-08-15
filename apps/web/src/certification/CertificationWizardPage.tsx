import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useWorkspace } from '../app/WorkspaceContext';
import { api, type Strategy } from '../shared/api';
import { toUserFacingError } from '../shared/mapApiError';
import { CertificationWizardView } from './CertificationWizardView';
import {
  buildCertifyRequest,
  nextWizardStep,
  previousWizardStep,
  type CertificationWizardDraft,
  type CertificationWizardStep,
} from './certification-wizard';

const INITIAL_DRAFT: CertificationWizardDraft = {
  candidate: null,
  version: '1.0.0',
  notes: '',
  evidence: [],
};

export function CertificationWizardPage() {
  const { activeWorkspace } = useWorkspace();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [step, setStep] = useState<CertificationWizardStep>('candidate');
  const [draft, setDraft] = useState<CertificationWizardDraft>(INITIAL_DRAFT);
  const [candidates, setCandidates] = useState<Strategy[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    api
      .listStrategies()
      .then((list) => {
        if (cancelled) return;
        setCandidates(list);
        const registryRef = searchParams.get('registryRef');
        if (registryRef) {
          const match = list.find((item) => item.id === registryRef);
          if (match) setDraft((current) => ({ ...current, candidate: match }));
        }
      })
      .catch((err: unknown) => {
        if (!cancelled) setError(toUserFacingError(err, 'Could not load research candidates.'));
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
      const result = await api.certifyStrategy(buildCertifyRequest(draft));
      navigate(`/strategy-library/certifications/${result.attemptId}`);
    } catch (err: unknown) {
      setError(toUserFacingError(err, 'Certification failed.'));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <CertificationWizardView
      step={step}
      draft={draft}
      candidates={candidates}
      loading={loading}
      submitting={submitting}
      error={error}
      onSelectCandidate={(candidate) => setDraft((current) => ({ ...current, candidate }))}
      onVersion={(version) => setDraft((current) => ({ ...current, version }))}
      onNotes={(notes) => setDraft((current) => ({ ...current, notes }))}
      onEvidence={(evidence) => setDraft((current) => ({ ...current, evidence }))}
      onBack={() => setStep((current) => previousWizardStep(current))}
      onNext={() => setStep((current) => nextWizardStep(current))}
      onSubmit={() => void onSubmit()}
    />
  );
}
