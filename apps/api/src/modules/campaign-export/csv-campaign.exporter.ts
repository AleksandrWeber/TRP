import { Injectable } from '@nestjs/common';
import type { CampaignSession } from '../campaign-session/campaign-session';
import type { CampaignExporter } from './campaign-exporter';
import { ExportFormat } from './export-format';

const CSV_HEADERS = [
  'sessionId',
  'status',
  'createdAt',
  'completedAt',
  'engineVersion',
  'metadataDatasetId',
  'tags',
  'campaignId',
  'strategyId',
  'datasetId',
  'totalRuns',
  'passCount',
  'failCount',
  'needsReviewCount',
  'bestExperimentId',
  'bestProfitFactor',
  'bestReturn',
  'bestExpectancy',
  'lowestDrawdown',
  'verdict',
  'recommendations',
  'reportCreatedAt',
  'sliceIdentity',
] as const;

/**
 * Flattens a CampaignSession (metadata + report) into a single CSV row.
 */
@Injectable()
export class CsvCampaignExporter implements CampaignExporter {
  readonly format = ExportFormat.CSV;

  export(session: CampaignSession): string {
    const { report, metadata } = session;
    const row = [
      session.id,
      session.status,
      session.createdAt,
      session.completedAt ?? '',
      metadata.engineVersion,
      metadata.datasetId ?? '',
      (metadata.tags ?? []).join(';'),
      report.campaignId,
      report.strategyId,
      report.datasetId,
      String(report.totalRuns),
      String(report.passCount),
      String(report.failCount),
      String(report.needsReviewCount),
      report.bestExperimentId ?? '',
      formatNullableNumber(report.bestProfitFactor),
      formatNullableNumber(report.bestReturn),
      formatNullableNumber(report.bestExpectancy),
      formatNullableNumber(report.lowestDrawdown),
      report.verdict,
      report.recommendations.join(';'),
      report.createdAt,
      report.sliceIdentity ?? '',
    ];

    return `${CSV_HEADERS.join(',')}\n${row.map(escapeCsvField).join(',')}`;
  }
}

function formatNullableNumber(value: number | null): string {
  return value === null ? '' : String(value);
}

function escapeCsvField(value: string): string {
  if (/[",\n\r]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}
