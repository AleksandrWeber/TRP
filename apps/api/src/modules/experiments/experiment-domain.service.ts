import { Injectable } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import type { CampaignSession } from '../campaign-session/campaign-session';
import type { CampaignReport } from '../research-campaign/campaign-report.types';
import type { Experiment } from './experiment';
import type { ExperimentMetadata } from './experiment-metadata';
import type { ExperimentVersion } from './experiment-version';

export type CreateExperimentFromSessionInput = {
  session: CampaignSession;
  metadata?: ExperimentMetadata;
};

export type CreateExperimentVersionInput = {
  report: CampaignReport;
  sourceSessionId: string;
  replayId?: string;
};

/**
 * In-memory Experiment domain service (US076).
 * createFromSession / createVersion / get / list — no Repository, API, or Knowledge wiring.
 *
 * Distinct from Prisma-backed {@link ExperimentsService} (backtest runner).
 */
@Injectable()
export class ExperimentDomainService {
  private readonly experiments = new Map<string, Experiment>();

  createFromSession(input: CreateExperimentFromSessionInput): Experiment {
    const { session } = input;
    const createdAt = new Date().toISOString();
    const firstVersion: ExperimentVersion = {
      version: 1,
      report: cloneReport(session.report),
      createdAt,
      sourceSessionId: session.id,
    };

    const experiment: Experiment = {
      experimentId: randomUUID(),
      sessionId: session.id,
      createdAt,
      currentVersion: 1,
      versions: [firstVersion],
      metadata: cloneMetadata(input.metadata ?? deriveMetadata(session)),
    };

    this.experiments.set(experiment.experimentId, experiment);
    return experiment;
  }

  createVersion(experimentId: string, input: CreateExperimentVersionInput): Experiment | null {
    const experiment = this.experiments.get(experimentId);
    if (!experiment) return null;

    const nextVersion = experiment.currentVersion + 1;
    const version: ExperimentVersion = {
      version: nextVersion,
      report: cloneReport(input.report),
      createdAt: new Date().toISOString(),
      sourceSessionId: input.sourceSessionId,
    };

    if (input.replayId !== undefined) {
      version.replayId = input.replayId;
    }

    experiment.versions.push(version);
    experiment.currentVersion = nextVersion;
    return experiment;
  }

  get(experimentId: string): Experiment | null {
    return this.experiments.get(experimentId) ?? null;
  }

  list(): Experiment[] {
    return Array.from(this.experiments.values());
  }
}

function deriveMetadata(session: CampaignSession): ExperimentMetadata {
  const metadata: ExperimentMetadata = {
    engineVersion: session.metadata.engineVersion,
  };
  if (session.metadata.datasetId !== undefined) {
    metadata.datasetId = session.metadata.datasetId;
  }
  if (session.metadata.tags !== undefined) {
    metadata.tags = [...session.metadata.tags];
  }
  if (session.report.strategyId) {
    metadata.strategyId = session.report.strategyId;
  }
  return metadata;
}

function cloneMetadata(metadata?: ExperimentMetadata): ExperimentMetadata {
  if (!metadata) return {};

  const cloned: ExperimentMetadata = {};
  if (metadata.engineVersion !== undefined) cloned.engineVersion = metadata.engineVersion;
  if (metadata.datasetId !== undefined) cloned.datasetId = metadata.datasetId;
  if (metadata.strategyId !== undefined) cloned.strategyId = metadata.strategyId;
  if (metadata.source !== undefined) cloned.source = metadata.source;
  if (metadata.tags !== undefined) cloned.tags = [...metadata.tags];
  return cloned;
}

function cloneReport(report: CampaignReport): CampaignReport {
  const cloned: CampaignReport = {
    ...report,
    recommendations: [...report.recommendations],
  };
  return cloned;
}
