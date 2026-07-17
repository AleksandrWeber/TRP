import { Injectable } from '@nestjs/common';
import type { CampaignReport } from '../research-campaign/campaign-report.types';
import type { ComparisonChange } from './comparison-change';
import type { ComparisonResult } from './comparison-result';
import type { Experiment } from './experiment';
import type { ExperimentComparison } from './experiment-comparison';
import { ExperimentDomainService } from './experiment-domain.service';
import type { ExperimentMetadata } from './experiment-metadata';
import type { ExperimentVersion } from './experiment-version';
import { ExperimentVersionNotFoundError } from './experiment-version-not-found.error';

type VersionSnapshot = {
  summary: string;
  insights: string[];
  tags: string[];
  metadata: Record<string, string>;
};

/**
 * Deterministic structural comparison of Experiment versions (US078).
 * No AI, similarity scoring, embeddings, API, or persistence.
 */
@Injectable()
export class ExperimentComparisonService {
  constructor(private readonly experiments: ExperimentDomainService) {}

  compareVersions(
    experimentId: string,
    versionA: number,
    versionB: number,
  ): ExperimentComparison | null {
    const experiment = this.experiments.get(experimentId);
    if (!experiment) return null;

    const left = requireVersion(experiment, versionA);
    const right = requireVersion(experiment, versionB);

    return {
      leftExperimentId: experimentId,
      rightExperimentId: experimentId,
      leftVersion: versionA,
      rightVersion: versionB,
      result: compareSnapshots(
        projectVersion(left, experiment.metadata),
        projectVersion(right, experiment.metadata),
      ),
    };
  }

  compareExperiments(experimentA: Experiment, experimentB: Experiment): ExperimentComparison {
    const left = requireVersion(experimentA, experimentA.currentVersion);
    const right = requireVersion(experimentB, experimentB.currentVersion);

    return {
      leftExperimentId: experimentA.experimentId,
      rightExperimentId: experimentB.experimentId,
      leftVersion: experimentA.currentVersion,
      rightVersion: experimentB.currentVersion,
      result: compareSnapshots(
        projectVersion(left, experimentA.metadata),
        projectVersion(right, experimentB.metadata),
      ),
    };
  }
}

function requireVersion(experiment: Experiment, version: number): ExperimentVersion {
  const found = experiment.versions.find((v) => v.version === version);
  if (!found) {
    throw new ExperimentVersionNotFoundError(experiment.experimentId, version);
  }
  return found;
}

/**
 * Deterministic projection aligned with KnowledgeExtractionService mapping.
 */
function projectVersion(
  version: ExperimentVersion,
  experimentMetadata: ExperimentMetadata,
): VersionSnapshot {
  const report = version.report;
  return {
    summary: buildSummary(report),
    insights: buildInsights(report),
    tags: buildTags(report, version.version),
    metadata: buildMetadata(report, experimentMetadata),
  };
}

function buildSummary(report: CampaignReport): string {
  return [
    `${report.passCount} pass / ${report.failCount} fail / ${report.needsReviewCount} needs_review`,
    `across ${report.totalRuns} runs`,
    `verdict ${report.verdict}`,
  ].join('; ');
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

function buildTags(report: CampaignReport, version: number): string[] {
  const tags = [report.strategyId, report.datasetId, report.verdict.toLowerCase(), `v${version}`];
  if (report.sliceIdentity) {
    tags.push(`slice:${report.sliceIdentity}`);
  }
  return tags;
}

function buildMetadata(
  report: CampaignReport,
  experimentMetadata: ExperimentMetadata,
): Record<string, string> {
  const metadata: Record<string, string> = {
    strategyId: report.strategyId,
    datasetId: report.datasetId,
  };
  if (experimentMetadata.engineVersion !== undefined) {
    metadata.engineVersion = experimentMetadata.engineVersion;
  }
  if (experimentMetadata.source !== undefined) {
    metadata.source = experimentMetadata.source;
  }
  return metadata;
}

function compareSnapshots(left: VersionSnapshot, right: VersionSnapshot): ComparisonResult {
  const insightDiff = diffSortedSets(left.insights, right.insights);
  const tagDiff = diffSortedSets(left.tags, right.tags);
  const summaryChanged = left.summary !== right.summary;

  return {
    addedInsights: insightDiff.added,
    removedInsights: insightDiff.removed,
    summaryChanged,
    previousSummary: left.summary,
    currentSummary: right.summary,
    addedTags: tagDiff.added,
    removedTags: tagDiff.removed,
    metadataDifferences: diffMetadata(left.metadata, right.metadata),
  };
}

function diffSortedSets(before: string[], after: string[]): { added: string[]; removed: string[] } {
  const beforeSet = new Set(before);
  const afterSet = new Set(after);
  return {
    added: [...afterSet].filter((item) => !beforeSet.has(item)).sort(),
    removed: [...beforeSet].filter((item) => !afterSet.has(item)).sort(),
  };
}

function diffMetadata(
  before: Record<string, string>,
  after: Record<string, string>,
): ComparisonChange[] {
  const keys = [...new Set([...Object.keys(before), ...Object.keys(after)])].sort();
  const changes: ComparisonChange[] = [];

  for (const key of keys) {
    const left = before[key];
    const right = after[key];
    if (left === right) continue;
    changes.push({
      key,
      before: left ?? null,
      after: right ?? null,
    });
  }

  return changes;
}
