/**
 * Application errors for US195 Multi-Year Research.
 */

export type MultiYearResearchErrorCode =
  | 'MULTI_YEAR_RESEARCH_VALIDATION'
  | 'MULTI_YEAR_RESEARCH_ALREADY_COMPLETED'
  | 'MULTI_YEAR_RESEARCH_DUPLICATE_EXECUTION'
  | 'MULTI_YEAR_RESEARCH_DATASET_FAILED'
  | 'MULTI_YEAR_RESEARCH_EXECUTION_FAILED';

export abstract class MultiYearResearchError extends Error {
  abstract readonly code: MultiYearResearchErrorCode;

  protected constructor(message: string) {
    super(message);
    this.name = new.target.name;
  }
}

export class MultiYearResearchValidationError extends MultiYearResearchError {
  readonly code = 'MULTI_YEAR_RESEARCH_VALIDATION' as const;
  readonly cause: unknown | undefined;

  constructor(message: string, cause?: unknown) {
    super(message);
    this.cause = cause;
  }
}

export class MultiYearResearchAlreadyCompletedError extends MultiYearResearchError {
  readonly code = 'MULTI_YEAR_RESEARCH_ALREADY_COMPLETED' as const;

  constructor(researchId: string) {
    super(`Multi-year research already completed for research: ${researchId}`);
  }
}

export class MultiYearResearchDuplicateExecutionError extends MultiYearResearchError {
  readonly code = 'MULTI_YEAR_RESEARCH_DUPLICATE_EXECUTION' as const;

  constructor() {
    super('Multi-year research execution is already in progress');
  }
}

export class MultiYearResearchDatasetFailedError extends MultiYearResearchError {
  readonly code = 'MULTI_YEAR_RESEARCH_DATASET_FAILED' as const;
  readonly cause: unknown | undefined;
  readonly datasetId: string;

  constructor(datasetId: string, cause?: unknown) {
    super(`Multi-year research failed for dataset: ${datasetId}`);
    this.datasetId = datasetId;
    this.cause = cause;
  }
}

export class MultiYearResearchExecutionFailedError extends MultiYearResearchError {
  readonly code = 'MULTI_YEAR_RESEARCH_EXECUTION_FAILED' as const;
  readonly cause: unknown | undefined;

  constructor(message: string, cause?: unknown) {
    super(message);
    this.cause = cause;
  }
}
