import type {
  OrchestrationRunDetailView,
  OrchestrationRunView,
  SessionHandoffIntentView,
} from '../shared/api';

export type OrchestrationReferenceView = {
  orchestrationRunId: string;
  sessionHandoffIntentId: string;
  createsSession: false;
};

export function matchOrchestrationReference(
  details: readonly OrchestrationRunDetailView[],
  deploymentId: string,
): OrchestrationReferenceView | null {
  const match = details.find((item) => item.handoff?.deploymentBindRef === deploymentId);
  if (!match?.handoff) return null;
  return {
    orchestrationRunId: match.orchestrationRunId,
    sessionHandoffIntentId: match.handoff.sessionHandoffIntentId,
    createsSession: false,
  };
}

export async function loadOrchestrationReference(
  deploymentId: string,
  listRuns: () => Promise<{ items: OrchestrationRunView[] }>,
  getRun: (runId: string) => Promise<OrchestrationRunDetailView>,
): Promise<OrchestrationReferenceView | null> {
  const history = await listRuns();
  const withHandoff = history.items.filter((item) => item.sessionHandoffIntentId);
  const details = await Promise.all(withHandoff.map((item) => getRun(item.orchestrationRunId)));
  return matchOrchestrationReference(details, deploymentId);
}

export function handoffCreatesSession(handoff: SessionHandoffIntentView | null): false {
  return handoff?.createsSession ?? false;
}
