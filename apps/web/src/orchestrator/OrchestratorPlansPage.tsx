import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useWorkspace } from '../app/WorkspaceContext';
import { api, type OrchestrationPlanView } from '../shared/api';
import { toUserFacingError } from '../shared/mapApiError';
import { OrchestratorPlanDetailView, OrchestratorPlansView } from './OrchestratorPlansView';

export function OrchestratorPlansPage() {
  const { activeWorkspace } = useWorkspace();
  const [items, setItems] = useState<OrchestrationPlanView[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    api
      .listOrchestrationPlans()
      .then((page) => {
        if (!cancelled) setItems(page.items);
      })
      .catch((err: unknown) => {
        if (!cancelled) setError(toUserFacingError(err, 'Could not load orchestration plans.'));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [activeWorkspace.id]);

  return <OrchestratorPlansView items={items} loading={loading} error={error} />;
}

export function OrchestratorPlanDetailPage() {
  const { planId } = useParams();
  const { activeWorkspace } = useWorkspace();
  const [record, setRecord] = useState<OrchestrationPlanView | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!planId) return;
    let cancelled = false;
    setLoading(true);
    setError(null);
    api
      .getOrchestrationPlan(planId)
      .then((plan) => {
        if (!cancelled) setRecord(plan);
      })
      .catch((err: unknown) => {
        if (!cancelled) setError(toUserFacingError(err, 'Could not load orchestration plan.'));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [activeWorkspace.id, planId]);

  return <OrchestratorPlanDetailView record={record} loading={loading} error={error} />;
}
