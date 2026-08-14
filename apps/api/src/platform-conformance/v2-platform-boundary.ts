/**
 * RC-28 Epic 1 — platform integration-audit descriptor.
 *
 * This is not a thirteenth business module and not a Source of Truth.
 * It composes closed RC-20…RC-27 boundaries for conformance tests.
 */

import { AI_ANALYTICS_BOUNDARY } from '../modules/ai-analytics/domain/ai-analytics-boundary';
import { EXCHANGE_SCOPE_BOUNDARY } from '../modules/exchange-scope/domain/exchange-scope-boundary';
import { KNOWLEDGE_LAKE_BOUNDARY } from '../modules/knowledge-lake/domain/knowledge-lake-boundary';
import { MARKET_PROFILE_BOUNDARY } from '../modules/market-profile/domain/market-profile-boundary';
import { MARKET_QUALIFICATION_BOUNDARY } from '../modules/market-qualification/domain/market-qualification-boundary';
import { MARKET_STATE_BOUNDARY } from '../modules/market-state/domain/market-state-boundary';
import { NOTIFICATION_DELIVERY_BOUNDARY } from '../modules/notification-delivery/domain/notification-boundary';
import { REPORTING_BOUNDARY } from '../modules/reporting/domain/reporting-boundary';
import { RUNTIME_ENFORCEMENT_BOUNDARY } from '../modules/runtime-enforcement/domain/runtime-enforcement-boundary';
import { STRATEGY_LIBRARY_BOUNDARY } from '../modules/strategy-library/domain/strategy-library-boundary';
import { TRADING_ORCHESTRATOR_BOUNDARY } from '../modules/trading-orchestrator/domain/trading-orchestrator-boundary';
import { V2_PLATFORM_MODULE_CATALOG, V2_PLATFORM_MODULE_IDS } from './v2-platform-modules';

export const V2_PLATFORM_AUDIT_ID = 'v2-platform-integration-audit' as const;

export const EXISTING_V2_BOUNDARIES = Object.freeze({
  'knowledge-lake': KNOWLEDGE_LAKE_BOUNDARY,
  'strategy-library': STRATEGY_LIBRARY_BOUNDARY,
  'runtime-enforcement': RUNTIME_ENFORCEMENT_BOUNDARY,
  reporting: REPORTING_BOUNDARY,
  'ai-analytics': AI_ANALYTICS_BOUNDARY,
  'notification-delivery': NOTIFICATION_DELIVERY_BOUNDARY,
  'market-qualification': MARKET_QUALIFICATION_BOUNDARY,
  'market-profile': MARKET_PROFILE_BOUNDARY,
  'market-state': MARKET_STATE_BOUNDARY,
  'trading-orchestrator': TRADING_ORCHESTRATOR_BOUNDARY,
  'exchange-scope': EXCHANGE_SCOPE_BOUNDARY,
} as const);

export type V2PlatformBoundary = Readonly<{
  auditId: typeof V2_PLATFORM_AUDIT_ID;
  moduleCount: 12;
  isNestModule: false;
  isNewDomain: false;
  isNewSourceOfTruth: false;
  isNewApplicationPort: false;
  isNewRuntime: false;
  registeredInAppModule: false;
  surfaces: typeof V2_PLATFORM_MODULE_IDS;
  catalog: typeof V2_PLATFORM_MODULE_CATALOG;
  existingBoundaries: typeof EXISTING_V2_BOUNDARIES;
}>;

export const V2_PLATFORM_BOUNDARY: V2PlatformBoundary = Object.freeze({
  auditId: V2_PLATFORM_AUDIT_ID,
  moduleCount: 12,
  isNestModule: false,
  isNewDomain: false,
  isNewSourceOfTruth: false,
  isNewApplicationPort: false,
  isNewRuntime: false,
  registeredInAppModule: false,
  surfaces: V2_PLATFORM_MODULE_IDS,
  catalog: V2_PLATFORM_MODULE_CATALOG,
  existingBoundaries: EXISTING_V2_BOUNDARIES,
});

export function v2PlatformIsNewModule(): false {
  return false;
}

export function v2PlatformIsNewSourceOfTruth(): false {
  return false;
}

export function v2PlatformIntroducesApplicationPorts(): false {
  return false;
}
