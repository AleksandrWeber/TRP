export {
  REPORTING_AUTHORITY_CLASS,
  REPORTING_BOUNDARY,
  REPORTING_DISTINCT_FROM,
  REPORTING_FORBIDDEN_CAPABILITIES,
  REPORTING_MODULE_ID,
  REPORTING_NON_OWNED,
  REPORTING_OWNED_CONCERNS,
  isReportingForbiddenCapability,
  isReportingOwnedConcern,
  reportingAuthorizes,
  reportingIsSourceOfTruth,
  reportingOwnsBusinessState,
  reportingTrades,
  reportingValidatesStrategies,
  resolveEnforcementConflict,
  resolveLakeStorageConflict,
  resolveLibraryConflict,
  resolveReportingAuthorityConflict,
  type ReportingBoundary,
  type ReportingForbiddenCapability,
  type ReportingNonOwned,
  type ReportingOwnedConcern,
} from './domain/reporting-boundary';
export {
  REPORTING_READ_AUTHORITY_CLASS,
  toAnalyticalFactQuery,
  toReportingAnalyticalFact,
  toReportingAnalyticalFactPage,
  type ReportingAnalyticalFact,
  type ReportingAnalyticalFactPage,
  type ReportingAnalyticalFactQuery,
} from './domain/reporting-analytical-read-model';
export {
  AGGREGATION_VISUALIZATION_HINTS,
  HISTORICAL_WINDOW_PRESETS,
  REPORTING_ALLOWED_METRIC_KEYS,
  REPORTING_DOMAIN_AUTHORITY_CLASS,
  REPORTING_FACT_MODES,
  REPORTING_FORBIDDEN_METRIC_KEYS,
  REPORTING_MONEY_ADJACENT_METRIC_KEYS,
  REPORT_DEFINITION_KINDS,
  REPORT_RUN_STATUSES,
  deepFreeze,
  isMoneyAdjacentMetricKey,
  isReportDefinitionKind,
  isReportingAllowedMetricKey,
  isReportingFactMode,
  isReportingForbiddenMetricKey,
  type AggregationVisualizationHint,
  type HistoricalWindowPreset,
  type ReportDefinitionKind,
  type ReportRunStatus,
  type ReportingFactMode,
  type ReportingMetricKey,
} from './domain/reporting-domain-shared';
export {
  createReportingSourceRef,
  isKnowledgeLakeSourceRef,
  REPORTING_SOURCE_OWNER_TYPES,
  type ReportingSourceOwnerType,
  type ReportingSourceRef,
} from './domain/reporting-source-ref';
export {
  createHistoricalWindow,
  type CreateHistoricalWindowInput,
  type HistoricalWindow,
} from './domain/historical-window';
export {
  createReportDefinition,
  snapshotReportDefinition,
  type CreateReportDefinitionInput,
  type ReportDefinition,
} from './domain/report-definition';
export {
  createReportRun,
  createReportSnapshot,
  type CreateReportRunInput,
  type ReportRun,
  type ReportRunSourceSummary,
  type ReportSnapshot,
} from './domain/report-run';
export {
  createAggregationSlice,
  createReportSection,
  type AggregationSlice,
  type CreateAggregationSliceInput,
  type ReportSection,
} from './domain/aggregation-slice';
export { aggregateReportingFacts } from './generation/aggregate-reporting-facts';
export { deriveReportRunId, stableHash } from './generation/derive-report-run-id';
export { InMemoryReportingStore } from './adapters/in-memory-reporting-store';
export { ReportingBoundaryService } from './reporting-boundary.service';
export { ReportingKnowledgeLakeReadService } from './reporting-knowledge-lake-read.service';
export { ReportingGenerationService } from './reporting-generation.service';
export { ReportingQueryService } from './reporting-query.service';
export { ReportingModule } from './reporting.module';
export {
  KNOWLEDGE_LAKE_QUERY_CONSUMER,
  REPORTING_PORTS_ACTIVE,
  REPORTING_QUERY_PORT,
  REPORTING_SERVICE_PORT,
  type CompareReportRuns,
  type ComparisonSlice,
  type ReportDefinitionPage,
  type ReportDefinitionQuery,
  type ReportRunOutcome,
  type ReportRunPage,
  type ReportRunQuery,
  type ReportRunResult,
  type ReportingQueryPort,
  type ReportingServicePort,
  type RequestReportRun,
} from './ports/reporting.port';
