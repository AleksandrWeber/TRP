import type { SliceRef, StrategyParams } from '@trp/research';
import type { PipelineContext } from '../../pipeline-context';
import type {
  CampaignReport,
  CampaignReportExperiment,
} from '../../../research-campaign/campaign-report.types';
import type {
  CampaignFailedRun,
  CampaignSummary,
  ResearchCampaignInput,
} from '../../../research-campaign/research-campaign.types';

/**
 * Typed accessors for Campaign PipelineContext payloads (US087).
 * Context remains structurally generic — helpers only cast known keys.
 */

export function readCampaignInput(context: PipelineContext): ResearchCampaignInput {
  const paramsList = Array.isArray(context.input.paramsList)
    ? (context.input.paramsList as StrategyParams[])
    : [];

  const input: ResearchCampaignInput = {
    datasetId: String(context.input.datasetId ?? ''),
    strategyId: String(context.input.strategyId ?? ''),
    paramsList,
  };

  if (context.input.sliceRef !== undefined) {
    input.sliceRef = context.input.sliceRef as SliceRef;
  }

  return input;
}

export function readPersistSession(context: PipelineContext): boolean {
  return context.input.persistSession !== false;
}

export type CampaignExecutionState = {
  campaignId: string;
  createdAt: string;
  sliceIdentity?: string;
  passCount: number;
  failCount: number;
  needsReviewCount: number;
  bestExperimentId: string | null;
  bestProfitFactor: number;
  failedRuns: CampaignFailedRun[];
  experiments: CampaignReportExperiment[];
};

export function readExecutionState(context: PipelineContext): CampaignExecutionState {
  return {
    campaignId: String(context.variables.campaignId ?? ''),
    createdAt: String(context.variables.createdAt ?? ''),
    sliceIdentity:
      context.variables.sliceIdentity === undefined
        ? undefined
        : String(context.variables.sliceIdentity),
    passCount: Number(context.variables.passCount ?? 0),
    failCount: Number(context.variables.failCount ?? 0),
    needsReviewCount: Number(context.variables.needsReviewCount ?? 0),
    bestExperimentId:
      context.variables.bestExperimentId === null ||
      context.variables.bestExperimentId === undefined
        ? null
        : String(context.variables.bestExperimentId),
    bestProfitFactor:
      typeof context.variables.bestProfitFactor === 'number'
        ? context.variables.bestProfitFactor
        : Number.NEGATIVE_INFINITY,
    failedRuns: Array.isArray(context.variables.failedRuns)
      ? (context.variables.failedRuns as CampaignFailedRun[])
      : [],
    experiments: Array.isArray(context.variables.experiments)
      ? (context.variables.experiments as CampaignReportExperiment[])
      : [],
  };
}

export function writeExecutionState(
  context: PipelineContext,
  state: CampaignExecutionState,
): PipelineContext {
  return {
    ...context,
    variables: {
      ...context.variables,
      campaignId: state.campaignId,
      createdAt: state.createdAt,
      sliceIdentity: state.sliceIdentity,
      passCount: state.passCount,
      failCount: state.failCount,
      needsReviewCount: state.needsReviewCount,
      bestExperimentId: state.bestExperimentId,
      bestProfitFactor: state.bestProfitFactor,
      failedRuns: state.failedRuns,
      experiments: state.experiments,
    },
  };
}

export function readSummary(context: PipelineContext): CampaignSummary {
  return context.output.summary as CampaignSummary;
}

export function readExperiments(context: PipelineContext): CampaignReportExperiment[] {
  if (Array.isArray(context.output.experiments)) {
    return context.output.experiments as CampaignReportExperiment[];
  }
  return readExecutionState(context).experiments;
}

export function readReport(context: PipelineContext): CampaignReport {
  return context.output.report as CampaignReport;
}
