import type { Insight } from '../insight/insight';
import { InsightType } from '../insight/insight-type';
import type { RecommendationMetadata } from './recommendation-metadata';
import { RecommendationPriority } from './recommendation-priority';
import { RecommendationType } from './recommendation-type';

export type RecommendationDraft = {
  insightIds: string[];
  campaignSessionIds: string[];
  type: RecommendationType;
  priority: RecommendationPriority;
  title: string;
  description: string;
  rationale: string;
  metadata: RecommendationMetadata;
};

/**
 * Deterministic Recommendation drafts from Insights (US098).
 * No LLM / AI providers — rule-based only.
 * Does not copy Insight summary/title as the Recommendation body beyond structured guidance.
 */
export function draftRecommendationsFromInsights(insights: Insight[]): RecommendationDraft[] {
  return insights.map((insight) => draftFromInsight(insight));
}

function draftFromInsight(insight: Insight): RecommendationDraft {
  const mapping = mapInsightToRecommendation(insight);
  const campaignSessionIds = insight.campaignSessionId ? [insight.campaignSessionId] : [];

  return {
    insightIds: [insight.id],
    campaignSessionIds,
    type: mapping.type,
    priority: mapping.priority,
    title: mapping.title,
    description: mapping.description,
    rationale: mapping.rationale,
    metadata: {
      confidence: insight.confidence,
      generatedBy: 'recommendation-deterministic',
      ruleId: mapping.ruleId,
    },
  };
}

type InsightRecommendationMapping = {
  type: RecommendationType;
  priority: RecommendationPriority;
  title: string;
  description: string;
  rationale: string;
  ruleId: string;
};

function mapInsightToRecommendation(insight: Insight): InsightRecommendationMapping {
  const text = `${insight.title} ${insight.summary}`.toLowerCase();

  if (matchesAny(text, ['insufficient', 'not enough', 'lack of evidence', 'sparse data'])) {
    return {
      type: RecommendationType.COLLECT_MORE_DATA,
      priority: priorityFromConfidence(insight.confidence, {
        high: RecommendationPriority.MEDIUM,
        mid: RecommendationPriority.LOW,
        low: RecommendationPriority.LOW,
      }),
      title: 'Collect more data',
      description: 'Gather additional evidence before drawing stronger conclusions.',
      rationale: `Insight ${insight.id} indicates insufficient evidence (rule: insufficient-evidence).`,
      ruleId: 'insufficient-evidence',
    };
  }

  if (
    matchesAny(text, [
      'model disagreement',
      'models disagree',
      'multiple model',
      'conflicting models',
      'disagree',
    ])
  ) {
    return {
      type: RecommendationType.COMPARE_MODELS,
      priority: priorityFromConfidence(insight.confidence, {
        high: RecommendationPriority.HIGH,
        mid: RecommendationPriority.MEDIUM,
        low: RecommendationPriority.MEDIUM,
      }),
      title: 'Compare models',
      description: 'Run a structured model comparison to resolve disagreement.',
      rationale: `Insight ${insight.id} indicates multi-model disagreement (rule: model-disagreement).`,
      ruleId: 'model-disagreement',
    };
  }

  if (
    matchesAny(text, ['conflict', 'conflicting', 'contradict']) ||
    (insight.type === InsightType.ANOMALY && matchesAny(text, ['verdict', 'conclusion']))
  ) {
    return {
      type: RecommendationType.VERIFY_RESULT,
      priority: priorityFromConfidence(insight.confidence, {
        high: RecommendationPriority.CRITICAL,
        mid: RecommendationPriority.HIGH,
        low: RecommendationPriority.MEDIUM,
      }),
      title: 'Verify result',
      description: 'Re-check conflicting conclusions with a controlled verification pass.',
      rationale: `Insight ${insight.id} indicates conflicting conclusions (rule: conflicting-conclusions).`,
      ruleId: 'conflicting-conclusions',
    };
  }

  if (
    insight.type === InsightType.ANOMALY ||
    matchesAny(text, ['anomaly', 'outlier', 'unexpected'])
  ) {
    return {
      type: RecommendationType.INVESTIGATE_ANOMALY,
      priority: priorityFromConfidence(insight.confidence, {
        high: RecommendationPriority.HIGH,
        mid: RecommendationPriority.HIGH,
        low: RecommendationPriority.MEDIUM,
      }),
      title: 'Investigate anomaly',
      description: 'Inspect the anomalous signal and isolate contributing factors.',
      rationale: `Insight ${insight.id} is classified as an anomaly (rule: anomaly).`,
      ruleId: 'anomaly',
    };
  }

  if (
    insight.type === InsightType.TREND ||
    matchesAny(text, ['stable trend', 'consistent trend', 'trend'])
  ) {
    return {
      type: RecommendationType.EXPAND_SCOPE,
      priority: priorityFromConfidence(insight.confidence, {
        high: RecommendationPriority.HIGH,
        mid: RecommendationPriority.MEDIUM,
        low: RecommendationPriority.LOW,
      }),
      title: 'Expand scope',
      description: 'Extend evaluation scope to validate the stable trend under broader conditions.',
      rationale: `Insight ${insight.id} indicates a stable trend (rule: stable-trend).`,
      ruleId: 'stable-trend',
    };
  }

  if (
    insight.type === InsightType.PATTERN ||
    matchesAny(text, ['repeated', 'recurring', 'pattern'])
  ) {
    return {
      type: RecommendationType.REPEAT_EXPERIMENT,
      priority: priorityFromConfidence(insight.confidence, {
        high: RecommendationPriority.HIGH,
        mid: RecommendationPriority.MEDIUM,
        low: RecommendationPriority.LOW,
      }),
      title: 'Repeat experiment',
      description: 'Re-run the experiment to confirm the repeated pattern holds.',
      rationale: `Insight ${insight.id} indicates a repeated pattern (rule: repeated-pattern).`,
      ruleId: 'repeated-pattern',
    };
  }

  // Default for SUMMARY / OBSERVATION / CORRELATION without stronger signals.
  return {
    type: RecommendationType.COLLECT_MORE_DATA,
    priority: RecommendationPriority.LOW,
    title: 'Collect more data',
    description: 'Accumulate more observations before escalating to a stronger action.',
    rationale: `Insight ${insight.id} lacks a stronger actionable signal (rule: default-collect-more-data).`,
    ruleId: 'default-collect-more-data',
  };
}

function matchesAny(text: string, needles: string[]): boolean {
  return needles.some((needle) => text.includes(needle));
}

function priorityFromConfidence(
  confidence: number,
  bands: {
    high: RecommendationPriority;
    mid: RecommendationPriority;
    low: RecommendationPriority;
  },
): RecommendationPriority {
  if (confidence >= 0.8) return bands.high;
  if (confidence >= 0.5) return bands.mid;
  return bands.low;
}
