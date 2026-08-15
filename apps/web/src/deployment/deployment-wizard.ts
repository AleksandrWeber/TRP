import type { StrategyLibraryRecordView } from '../shared/api';
import { runtimeValidationReasonLabel } from '../runtime-validation/runtime-validation';

export const DEPLOYMENT_WIZARD_STEPS = ['version', 'point', 'confirm'] as const;

export type DeploymentWizardStep = (typeof DEPLOYMENT_WIZARD_STEPS)[number];

/** Paper configuration identities already used by certified Strategy Deployment. */
export const PAPER_DEPLOYMENT_DEFAULTS = Object.freeze({
  marketDataSourceId: 'binance-spot',
  paperExecutionConfigurationId: 'paper-config-us167',
  riskPolicyId: 'm2-baseline-paper-risk',
  riskPolicyVersion: 1,
});

export type DeploymentWizardDraft = {
  entry: StrategyLibraryRecordView | null;
  instrument: string;
  timeframe: string;
  notes: string;
};

export function nextWizardStep(step: DeploymentWizardStep): DeploymentWizardStep {
  if (step === 'version') return 'point';
  if (step === 'point') return 'confirm';
  return 'confirm';
}

export function previousWizardStep(step: DeploymentWizardStep): DeploymentWizardStep {
  if (step === 'confirm') return 'point';
  if (step === 'point') return 'version';
  return 'version';
}

export function allowedSymbols(entry: StrategyLibraryRecordView): string[] {
  const envelope = entry.tacticalEnvelope?.allowedSymbols;
  if (envelope && envelope.length > 0) return [...envelope];
  if (entry.version.supportedUniverse.kind === 'symbols') {
    return [...entry.version.supportedUniverse.symbols];
  }
  return [];
}

export function allowedTimeframes(entry: StrategyLibraryRecordView): string[] {
  const envelope = entry.tacticalEnvelope?.allowedTimeframes;
  if (envelope && envelope.length > 0) return [...envelope];
  return [...entry.version.supportedTimeframes];
}

export function draftFromEntry(
  entry: StrategyLibraryRecordView,
): Pick<DeploymentWizardDraft, 'entry' | 'instrument' | 'timeframe'> {
  return {
    entry,
    instrument: allowedSymbols(entry)[0] ?? '',
    timeframe: allowedTimeframes(entry)[0] ?? '',
  };
}

export function pointComplete(draft: DeploymentWizardDraft): boolean {
  return Boolean(draft.entry && draft.instrument.trim() && draft.timeframe.trim());
}

export function buildCreateDeploymentRequest(draft: DeploymentWizardDraft) {
  const entry = draft.entry;
  if (!entry) {
    throw new Error('Select a Strategy Version.');
  }
  const strategyId = entry.strategy.registryRef?.trim();
  if (!strategyId) {
    throw new Error('This Library version has no research registry reference.');
  }
  const instrument = draft.instrument.trim().toUpperCase();
  const timeframe = draft.timeframe.trim();
  if (!instrument || !timeframe) {
    throw new Error('Select an instrument and timeframe.');
  }

  return {
    strategyId,
    strategyVersion: entry.version.version,
    libraryEntryId: entry.version.libraryEntryId,
    parameters: {},
    instrument,
    timeframe,
    marketDataSourceId: PAPER_DEPLOYMENT_DEFAULTS.marketDataSourceId,
    paperExecutionConfigurationId: PAPER_DEPLOYMENT_DEFAULTS.paperExecutionConfigurationId,
    riskPolicyId: PAPER_DEPLOYMENT_DEFAULTS.riskPolicyId,
    riskPolicyVersion: PAPER_DEPLOYMENT_DEFAULTS.riskPolicyVersion,
    metadata: {
      strategyName: entry.strategy.name,
      strategyFamilyId: entry.strategy.strategyFamilyId,
      libraryEntryId: entry.version.libraryEntryId,
      notes: draft.notes.trim() || undefined,
    },
  };
}

export function deploymentStatusLabel(status: string): string {
  if (status === 'draft') return 'Draft';
  if (status === 'approved') return 'Approved';
  return status;
}

export function gateOutcomeLabel(
  authorization: { outcome: string; validation: string } | null | undefined,
): string {
  if (!authorization) return 'Not recorded';
  if (authorization.outcome === 'pass' && authorization.validation === 'VALID') return 'PASS';
  return 'FAIL';
}

export { runtimeValidationReasonLabel as deploymentGateReasonLabel };
