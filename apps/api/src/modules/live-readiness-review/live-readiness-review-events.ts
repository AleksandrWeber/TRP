/**
 * Application events for US200 Live Readiness Review.
 *
 * Collected in-memory by LiveReadinessReviewService. No transport layer
 * and no message bus.
 */

import type { ReadinessCategory } from './readiness-category';
import type { ReadinessCategoryStatus } from './readiness-category-status';
import type { OverallReadinessStatus } from './overall-readiness-status';

export const LIVE_READINESS_REVIEW_EVENT_TYPES = Object.freeze([
  'ReviewStarted',
  'CategoryVerified',
  'ReviewCompleted',
] as const);

export type LiveReadinessReviewEventType = (typeof LIVE_READINESS_REVIEW_EVENT_TYPES)[number];

type LiveReadinessReviewEventBase<Type extends string> = Readonly<{
  eventType: Type;
  reviewId: string;
  occurredAt: string;
}>;

export type ReviewStarted = LiveReadinessReviewEventBase<'ReviewStarted'> &
  Readonly<{
    totalCategories: number;
  }>;

export type CategoryVerified = LiveReadinessReviewEventBase<'CategoryVerified'> &
  Readonly<{
    category: ReadinessCategory;
    status: ReadinessCategoryStatus;
    checksPassed: number;
    checksFailed: number;
    warnings: number;
    verifiedAt: string;
  }>;

export type ReviewCompleted = LiveReadinessReviewEventBase<'ReviewCompleted'> &
  Readonly<{
    overallStatus: OverallReadinessStatus;
    passedChecks: number;
    failedChecks: number;
    warnings: number;
    duration: number;
    completedAt: string;
  }>;

export type LiveReadinessReviewEvent = ReviewStarted | CategoryVerified | ReviewCompleted;
