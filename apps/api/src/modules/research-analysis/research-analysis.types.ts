import type { CampaignReport } from '../research-campaign/campaign-report.types';

export type ResearchAnalysis = {
  executiveSummary: string;
  strengths: string[];
  weaknesses: string[];
  recommendations: string[];
  nextHypothesis: string;
};

export type { CampaignReport };
