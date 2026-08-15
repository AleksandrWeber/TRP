import type { StrategyDeploymentView, StrategyLibraryRecordView } from '../shared/api';
import { allowedSymbols, allowedTimeframes } from '../deployment/deployment-wizard';

export const ORCHESTRATOR_WIZARD_STEPS = ['plan', 'selection', 'confirm'] as const;

export type OrchestratorWizardStep = (typeof ORCHESTRATOR_WIZARD_STEPS)[number];

export const ORCHESTRATOR_PROGRESS = ['plan', 'run', 'selection', 'handoff', 'complete'] as const;

export type OrchestratorProgress = (typeof ORCHESTRATOR_PROGRESS)[number];

export type OrchestratorWizardDraft = {
  marketSymbol: string;
  exchangeScopeId: string;
  objective: string;
  entry: StrategyLibraryRecordView | null;
  deployment: StrategyDeploymentView | null;
  timeframe: string;
};

export const INITIAL_ORCHESTRATOR_DRAFT: OrchestratorWizardDraft = {
  marketSymbol: '',
  exchangeScopeId: 'binance-spot',
  objective: 'Coordinate a certified paper selection',
  entry: null,
  deployment: null,
  timeframe: '',
};

export function nextOrchestratorStep(step: OrchestratorWizardStep): OrchestratorWizardStep {
  if (step === 'plan') return 'selection';
  if (step === 'selection') return 'confirm';
  return 'confirm';
}

export function previousOrchestratorStep(step: OrchestratorWizardStep): OrchestratorWizardStep {
  if (step === 'confirm') return 'selection';
  if (step === 'selection') return 'plan';
  return 'plan';
}

export function planComplete(draft: OrchestratorWizardDraft): boolean {
  return Boolean(
    draft.marketSymbol.trim() && draft.exchangeScopeId.trim() && draft.objective.trim(),
  );
}

export function selectionComplete(draft: OrchestratorWizardDraft): boolean {
  return Boolean(draft.entry && draft.deployment && draft.timeframe.trim());
}

export function draftFromEntry(
  draft: OrchestratorWizardDraft,
  entry: StrategyLibraryRecordView,
): OrchestratorWizardDraft {
  const symbols = allowedSymbols(entry);
  const timeframes = allowedTimeframes(entry);
  return {
    ...draft,
    entry,
    marketSymbol: draft.marketSymbol.trim() || symbols[0] || '',
    timeframe: draft.timeframe.trim() || timeframes[0] || '',
    exchangeScopeId:
      draft.exchangeScopeId.trim() || entry.version.supportedExchangeScopeIds[0] || 'binance-spot',
  };
}

export function draftFromDeployment(
  draft: OrchestratorWizardDraft,
  deployment: StrategyDeploymentView,
): OrchestratorWizardDraft {
  return {
    ...draft,
    deployment,
    marketSymbol: draft.marketSymbol.trim() || deployment.instrument,
    timeframe: draft.timeframe.trim() || deployment.timeframe,
    exchangeScopeId: draft.exchangeScopeId.trim() || deployment.exchangeScopeId,
  };
}

export function buildCreatePlanRequest(draft: OrchestratorWizardDraft) {
  if (!planComplete(draft)) {
    throw new Error('Enter a market, Exchange Scope, and objective.');
  }
  return {
    marketSymbol: draft.marketSymbol.trim().toUpperCase(),
    exchangeScopeId: draft.exchangeScopeId.trim(),
    modeContext: 'paper' as const,
    objective: draft.objective.trim(),
    rationaleSummary: 'Paper coordination request. Does not start a Session.',
  };
}

export function buildRequestRunBody(draft: OrchestratorWizardDraft, orchestrationPlanId: string) {
  return {
    marketSymbol: draft.marketSymbol.trim().toUpperCase(),
    exchangeScopeId: draft.exchangeScopeId.trim(),
    modeContext: 'paper' as const,
    objective: draft.objective.trim(),
    orchestrationPlanId,
  };
}

export function buildProposeSelectionBody(draft: OrchestratorWizardDraft) {
  const entry = draft.entry;
  if (!entry) throw new Error('Select a Strategy Version.');
  const envelopeVersion = entry.tacticalEnvelope?.envelopeVersion;
  if (!envelopeVersion) throw new Error('This Strategy Version has no tactical envelope.');
  return {
    libraryEntryId: entry.version.libraryEntryId,
    strategyVersionId: entry.version.version,
    envelopeVersion,
    tacticPoint: {
      symbol: draft.marketSymbol.trim().toUpperCase(),
      timeframe: draft.timeframe.trim(),
      exchangeScopeId: draft.exchangeScopeId.trim(),
    },
  };
}

export function buildEmitHandoffBody(selectionDecisionId: string, deploymentBindRef: string) {
  if (!selectionDecisionId.trim() || !deploymentBindRef.trim()) {
    throw new Error('Selection and Deployment bind are required.');
  }
  return {
    selectionDecisionId,
    deploymentBindRef,
  };
}

export function orchestrationStatusLabel(status: string): string {
  switch (status) {
    case 'requested':
      return 'Requested';
    case 'confirmed':
      return 'Confirmed';
    case 'selecting':
      return 'Selecting';
    case 'selected':
      return 'Selected';
    case 'handing_off':
      return 'Handing off';
    case 'handed_off':
      return 'Handoff intent emitted';
    case 'rejected':
      return 'Rejected';
    case 'cancelled':
      return 'Cancelled';
    case 'failed':
      return 'Failed';
    default:
      return status;
  }
}

export function orchestrationLifecycleLabel(status: string): string {
  switch (status) {
    case 'created':
      return 'Created';
    case 'planned':
      return 'Planned';
    case 'ready':
      return 'Ready';
    case 'cancelled':
      return 'Cancelled';
    case 'archived':
      return 'Archived';
    default:
      return status;
  }
}

export function orchestrationProgressLabel(progress: OrchestratorProgress): string {
  switch (progress) {
    case 'plan':
      return 'Publishing plan…';
    case 'run':
      return 'Requesting orchestration…';
    case 'selection':
      return 'Proposing selection…';
    case 'handoff':
      return 'Emitting Session Handoff Intent…';
    case 'complete':
      return 'Coordination complete';
  }
}

export function approvedDeployments(
  items: readonly StrategyDeploymentView[],
): StrategyDeploymentView[] {
  return items.filter((item) => item.status === 'approved');
}
