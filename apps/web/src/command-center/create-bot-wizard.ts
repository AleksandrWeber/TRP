import type { StrategyDeploymentView } from '../shared/api';

export const CREATE_BOT_WIZARD_STEPS = ['deployment', 'account', 'confirm'] as const;

export type CreateBotWizardStep = (typeof CREATE_BOT_WIZARD_STEPS)[number];

export type CreateBotWizardDraft = {
  deployment: StrategyDeploymentView | null;
  currency: string;
  openingCapital: string;
};

export const INITIAL_CREATE_BOT_DRAFT: CreateBotWizardDraft = {
  deployment: null,
  currency: 'USDT',
  openingCapital: '100000',
};

export function approvedDeployments(
  records: readonly StrategyDeploymentView[],
): StrategyDeploymentView[] {
  return records.filter((record) => record.status === 'approved');
}

export function nextCreateBotStep(step: CreateBotWizardStep): CreateBotWizardStep {
  if (step === 'deployment') return 'account';
  if (step === 'account') return 'confirm';
  return 'confirm';
}

export function previousCreateBotStep(step: CreateBotWizardStep): CreateBotWizardStep {
  if (step === 'confirm') return 'account';
  if (step === 'account') return 'deployment';
  return 'deployment';
}

export function accountComplete(draft: CreateBotWizardDraft): boolean {
  return Boolean(draft.currency.trim() && draft.openingCapital.trim());
}

export function createBotReady(draft: CreateBotWizardDraft): boolean {
  return Boolean(draft.deployment && accountComplete(draft));
}

export function buildCreatePaperAccountRequest(draft: CreateBotWizardDraft) {
  return {
    currency: draft.currency.trim().toUpperCase(),
    openingCapital: draft.openingCapital.trim(),
    mode: 'paper' as const,
    idempotencyKey: `cc-paper-account:${draft.deployment?.id ?? 'none'}:${Date.now()}`,
  };
}

export function buildCreateTradingSessionRequest(
  draft: CreateBotWizardDraft,
  paperAccountId: string,
  sessionHandoffIntentId?: string,
) {
  const deploymentId = draft.deployment?.id;
  if (!deploymentId) {
    throw new Error('Select an approved Deployment.');
  }
  return {
    paperAccountId,
    deploymentId,
    origin: 'strategy' as const,
    idempotencyKey: sessionHandoffIntentId
      ? `handoff:${sessionHandoffIntentId}`
      : `cc-session:${deploymentId}:${paperAccountId}`,
    ...(sessionHandoffIntentId ? { sessionHandoffIntentId } : {}),
  };
}

export type CreateBotProgress = 'account' | 'session' | 'start' | 'complete';

export function createBotProgressLabel(progress: CreateBotProgress): string {
  if (progress === 'account') return 'Creating paper account…';
  if (progress === 'session') return 'Creating Trading Session…';
  if (progress === 'start') return 'Starting paper session…';
  return 'Paper bot is running.';
}
