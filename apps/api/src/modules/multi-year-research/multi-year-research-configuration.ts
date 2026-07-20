import type { HistoricalDataset } from '../historical-replay';
import {
  createWalkForwardConfiguration,
  generateReplayWindows,
  type WalkForwardConfiguration,
} from '../walk-forward-validation';

/**
 * Immutable Multi-Year Research configuration (US195).
 *
 * walkForwardConfiguration supplies window parameters applied to every dataset.
 * maximumParallelism is informational only — execution remains sequential.
 */

export type WalkForwardConfigurationTemplate = Readonly<{
  trainingWindow: number;
  validationWindow: number;
  stepSize: number;
  overlap: number;
  maximumWindows: number;
}>;

export type MultiYearResearchConfiguration = Readonly<{
  researchId: string;
  datasets: readonly HistoricalDataset[];
  walkForwardConfiguration: WalkForwardConfigurationTemplate;
  maximumParallelism: number;
  stopOnFailure: boolean;
}>;

export type CreateMultiYearResearchConfigurationInput = Readonly<{
  researchId: string;
  datasets: readonly HistoricalDataset[];
  walkForwardConfiguration: WalkForwardConfigurationTemplate;
  maximumParallelism: number;
  stopOnFailure: boolean;
}>;

export function createMultiYearResearchConfiguration(
  input: CreateMultiYearResearchConfigurationInput,
): MultiYearResearchConfiguration {
  const researchId = required(input.researchId, 'researchId');
  const datasets = validateDatasets(input.datasets);
  const walkForwardConfiguration = validateWalkForwardTemplate(input.walkForwardConfiguration);
  const maximumParallelism = positiveInteger(input.maximumParallelism, 'maximumParallelism');
  const stopOnFailure = input.stopOnFailure === true;

  for (const dataset of datasets) {
    validateDatasetWalkForwardCompatibility(dataset, walkForwardConfiguration);
  }

  return Object.freeze({
    researchId,
    datasets,
    walkForwardConfiguration,
    maximumParallelism,
    stopOnFailure,
  });
}

export function createDatasetWalkForwardConfiguration(
  datasetId: string,
  template: WalkForwardConfigurationTemplate,
): WalkForwardConfiguration {
  return createWalkForwardConfiguration({
    datasetId,
    ...template,
  });
}

function validateDatasets(
  datasets: readonly HistoricalDataset[] | null | undefined,
): readonly HistoricalDataset[] {
  if (datasets === null || datasets === undefined) {
    throw new Error('datasets are required');
  }
  if (datasets.length === 0) {
    throw new Error('datasets must not be empty');
  }

  const seen = new Set<string>();
  const frozen: HistoricalDataset[] = [];

  for (const dataset of datasets) {
    const datasetId = required(dataset.datasetId, 'datasetId');
    if (seen.has(datasetId)) {
      throw new Error(`duplicate dataset identifier: ${datasetId}`);
    }
    seen.add(datasetId);

    if (dataset.candles.length === 0) {
      throw new Error(`dataset must not be empty: ${datasetId}`);
    }

    frozen.push(dataset);
  }

  return Object.freeze(frozen);
}

function validateWalkForwardTemplate(
  template: WalkForwardConfigurationTemplate | null | undefined,
): WalkForwardConfigurationTemplate {
  if (template === null || template === undefined) {
    throw new Error('walkForwardConfiguration is required');
  }

  createWalkForwardConfiguration({
    datasetId: '__template__',
    ...template,
  });

  return Object.freeze({
    trainingWindow: template.trainingWindow,
    validationWindow: template.validationWindow,
    stepSize: template.stepSize,
    overlap: template.overlap,
    maximumWindows: template.maximumWindows,
  });
}

function validateDatasetWalkForwardCompatibility(
  dataset: HistoricalDataset,
  template: WalkForwardConfigurationTemplate,
): void {
  const configuration = createWalkForwardConfiguration({
    datasetId: dataset.datasetId,
    ...template,
  });
  generateReplayWindows(dataset, configuration);
}

function required(value: string, field: string): string {
  const normalized = typeof value === 'string' ? value.trim() : '';
  if (normalized === '') {
    throw new Error(`${field} is required`);
  }
  return normalized;
}

function positiveInteger(value: number, field: string): number {
  if (!Number.isInteger(value) || value < 1) {
    throw new Error(`${field} must be a positive integer`);
  }
  return value;
}
