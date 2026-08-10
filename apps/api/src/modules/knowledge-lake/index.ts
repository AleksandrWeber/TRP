export {
  KNOWLEDGE_LAKE_AUTHORITY_CLASS,
  KNOWLEDGE_LAKE_BOUNDARY,
  KNOWLEDGE_LAKE_DISTINCT_FROM,
  KNOWLEDGE_LAKE_EVENT_CATEGORIES,
  KNOWLEDGE_LAKE_FORBIDDEN_CAPABILITIES,
  KNOWLEDGE_LAKE_MODULE_ID,
  KNOWLEDGE_LAKE_NON_OWNED_SOT,
  KNOWLEDGE_LAKE_OWNERSHIP_CHAIN,
  KNOWLEDGE_LAKE_WRITE_SEMANTICS,
  isKnowledgeLakeEventCategory,
  isKnowledgeLakeForbiddenCapability,
  knowledgeLakeOwnsBusinessState,
  resolveAuthorityConflict,
  type KnowledgeLakeBoundary,
  type KnowledgeLakeEventCategory,
  type KnowledgeLakeForbiddenCapability,
  type KnowledgeLakeOwnershipStage,
} from './domain/knowledge-lake-boundary';
export {
  KNOWLEDGE_LAKE_FACT_MODES,
  deepFreezeClone,
  isKnowledgeLakeFactMode,
  toAnalyticalFact,
  validateAnalyticalFactAdmission,
  type AdmitRejectedReason,
  type AdmitResult,
  type AnalyticalFact,
  type AnalyticalFactAdmission,
  type AnalyticalFactSourceRef,
  type KnowledgeLakeFactMode,
} from './domain/analytical-fact-admission';
export {
  KNOWLEDGE_LAKE_QUERY_AUTHORITY_CLASS,
  KNOWLEDGE_LAKE_QUERY_DEFAULT_LIMIT,
  KNOWLEDGE_LAKE_QUERY_MAX_LIMIT,
  type AnalyticalFactPage,
  type AnalyticalFactQuery,
} from './domain/analytical-fact-query';
export { InMemoryKnowledgeLakeIngestionAdapter } from './ingestion/in-memory-knowledge-lake-ingestion.adapter';
export { KnowledgeLakeBoundaryService } from './knowledge-lake-boundary.service';
export { KnowledgeLakeModule } from './knowledge-lake.module';
export {
  KNOWLEDGE_LAKE_INGESTION_PORT,
  type KnowledgeLakeIngestionPort,
} from './ports/knowledge-lake-ingestion.port';
export {
  KNOWLEDGE_LAKE_QUERY_PORT,
  type KnowledgeLakeQueryPort,
} from './ports/knowledge-lake-query.port';
export { queryAnalyticalFacts } from './query/query-analytical-facts';
export {
  KNOWLEDGE_LAKE_TRADING_PATH_PRODUCERS,
  type TradingPathProducerId,
  type TradingPathProducerRegistration,
} from './projections/trading-path-producer-registry';
export { projectTradingPathEnvelope } from './projections/project-trading-path-envelope';
export { bestEffortAdmit } from './projections/best-effort-admit';
export { KnowledgeLakeTradingPathOutboxConsumer } from './projections/knowledge-lake-trading-path-outbox.consumer';
export {
  ExecutionFillLakeProjectionAdapter,
  OrdersLakeProjectionAdapter,
  PaperTradingLakeProjectionAdapter,
  RiskLakeProjectionAdapter,
  TradingSessionLakeProjectionAdapter,
} from './projections/trading-path-projection.adapters';
export {
  KNOWLEDGE_LAKE_RESEARCH_LAB_PRODUCER,
  type ResearchLabOutcomeKind,
  type ResearchLabProducerId,
  type ResearchLabProducerRegistration,
} from './projections/research-lab-producer-registry';
export {
  type CampaignCompletedOutcome,
  type EvidenceGeneratedOutcome,
  type ExperimentCompletedOutcome,
  type ResearchAnalyticalOutcome,
  type ValidationCompletedOutcome,
} from './projections/research-analytical-outcome';
export { projectResearchOutcome } from './projections/project-research-outcome';
export { KnowledgeLakeResearchLabProjectionService } from './projections/knowledge-lake-research-lab-projection.service';
export {
  CampaignCompletedLakeProjectionAdapter,
  EvidenceGeneratedLakeProjectionAdapter,
  ExperimentCompletedLakeProjectionAdapter,
  ValidationCompletedLakeProjectionAdapter,
} from './projections/research-lab-projection.adapters';
