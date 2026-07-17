/**
 * Built-in Pipeline Template identifiers (US085).
 * Step metadata only — no business step implementations.
 */
export const BUILTIN_PIPELINE_TEMPLATE_IDS = {
  campaign: 'campaign-pipeline',
  replay: 'replay-pipeline',
  knowledge: 'knowledge-pipeline',
  insight: 'insight-pipeline',
  crossCampaignAnalysis: 'cross-campaign-analysis-pipeline',
} as const;

export type BuiltinPipelineTemplateId =
  (typeof BUILTIN_PIPELINE_TEMPLATE_IDS)[keyof typeof BUILTIN_PIPELINE_TEMPLATE_IDS];
