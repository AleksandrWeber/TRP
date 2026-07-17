/**
 * A deterministic analytical finding from cross-campaign comparison (US097).
 */
export type CrossCampaignFindingKind =
  | 'repeated_finding'
  | 'recurring_pattern'
  | 'conflicting_conclusion'
  | 'stable_trend'
  | 'unique_observation';

export type CrossCampaignFinding = {
  kind: CrossCampaignFindingKind;
  title: string;
  summary: string;
  confidence: number;
  campaignIds: string[];
  knowledgeEntryIds: string[];
  experimentIds: string[];
};
