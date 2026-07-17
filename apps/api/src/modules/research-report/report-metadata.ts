/**
 * Extensible metadata for a ResearchReport (US099).
 * Aggregation counts / provenance hints only — not entity payloads.
 */
export type ReportMetadata = {
  campaignCount?: number;
  knowledgeEntryCount?: number;
  insightCount?: number;
  recommendationCount?: number;
  generatedBy?: string;
};
