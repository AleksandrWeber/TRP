export type WalkForwardOverallAssessment = 'ROBUST' | 'PROMISING' | 'UNSTABLE' | 'UNUSABLE';

export type WalkForwardAnalysis = {
  overallAssessment: WalkForwardOverallAssessment;
  strengths: string[];
  weaknesses: string[];
  recommendations: string[];
  stabilityScore: number;
  consistencyScore: number;
};
