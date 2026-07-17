import { Injectable } from '@nestjs/common';
import type { Experiment } from '../experiments/experiment';
import { resolveCurrentReport } from '../pipeline/steps/knowledge/knowledge-session.helpers';
import type { CampaignReport } from '../research-campaign/campaign-report.types';
import type { KnowledgeEntry } from './knowledge-entry';
import type { KnowledgeMetadata } from './knowledge-metadata';
import type { KnowledgeTag } from './knowledge-tag';

/**
 * A KnowledgeEntry draft prior to persistence — lacks workspaceId, which is
 * stamped by KnowledgeDomainService.create / the upsert pipeline step (US109).
 */
export type KnowledgeEntryDraft = Omit<KnowledgeEntry, 'workspaceId'>;

/**
 * Deterministic Knowledge extraction from Experiment versions (US077 / US090).
 * Uses only Experiment.currentVersion.report — no AI / LLM / external services.
 */
@Injectable()
export class KnowledgeExtractionService {
  extract(experiment: Experiment): KnowledgeEntryDraft {
    const report = resolveCurrentReport(experiment);

    return {
      knowledgeId: '',
      experimentId: experiment.experimentId,
      createdAt: report.createdAt,
      title: buildTitle(report),
      summary: buildSummary(report),
      tags: buildTags(report, experiment.currentVersion),
      insights: buildInsights(report),
      metadata: buildMetadata(report, experiment),
    };
  }
}

function buildTitle(report: CampaignReport): string {
  return `${report.strategyId} on ${report.datasetId}: ${report.verdict}`;
}

function buildSummary(report: CampaignReport): string {
  return [
    `${report.passCount} pass / ${report.failCount} fail / ${report.needsReviewCount} needs_review`,
    `across ${report.totalRuns} runs`,
    `verdict ${report.verdict}`,
  ].join('; ');
}

function buildTags(report: CampaignReport, currentVersion: number): KnowledgeTag[] {
  const tags: KnowledgeTag[] = [
    report.strategyId,
    report.datasetId,
    report.verdict.toLowerCase(),
    `v${currentVersion}`,
  ];
  if (report.sliceIdentity) {
    tags.push(`slice:${report.sliceIdentity}`);
  }
  return tags;
}

function buildInsights(report: CampaignReport): string[] {
  const insights: string[] = [...report.recommendations];

  if (report.bestProfitFactor !== null) {
    insights.push(`Best profit factor: ${report.bestProfitFactor}`);
  }
  if (report.bestReturn !== null) {
    insights.push(`Best return: ${report.bestReturn}`);
  }
  if (report.lowestDrawdown !== null) {
    insights.push(`Lowest drawdown: ${report.lowestDrawdown}`);
  }

  return insights;
}

function buildMetadata(report: CampaignReport, experiment: Experiment): KnowledgeMetadata {
  const metadata: KnowledgeMetadata = {
    strategyId: report.strategyId,
    datasetId: report.datasetId,
    source: 'extraction',
  };

  if (experiment.metadata.engineVersion !== undefined) {
    metadata.engineVersion = experiment.metadata.engineVersion;
  }

  return metadata;
}
