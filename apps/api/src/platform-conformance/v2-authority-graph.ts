/**
 * RC-28 Epic 3 — authority graph for the twelve Version 2 surfaces.
 *
 * Composes existing RC-20…RC-27 boundary descriptors. Does not add
 * ownership, ports, modules, or Authority Matrix rows.
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
import { V2_ALLOWED_CONSUME_EDGES, V2_FORBIDDEN_REVERSE_EDGES } from './v2-integration-graph';
import {
  V2_PLATFORM_MODULE_CATALOG,
  V2_PLATFORM_MODULE_IDS,
  type V2PlatformModuleId,
} from './v2-platform-modules';

/**
 * Authority Matrix primary classes plus the approved Gate / research /
 * orchestration specializations already locked by closed RCs.
 */
export type V2MatrixPrimaryClass =
  | 'source_of_truth'
  | 'policy_input'
  | 'projection'
  | 'narrative'
  | 'command_ui'
  | 'gate'
  | 'research_artifact'
  | 'orchestration';

export const V2_MATRIX_PRIMARY_CLASS: Readonly<Record<V2PlatformModuleId, V2MatrixPrimaryClass>> =
  Object.freeze({
    'command-center': 'command_ui',
    'knowledge-lake': 'projection',
    'strategy-library': 'source_of_truth',
    'runtime-enforcement': 'gate',
    reporting: 'projection',
    'ai-analytics': 'narrative',
    'notification-delivery': 'projection',
    'market-qualification': 'research_artifact',
    'market-profile': 'research_artifact',
    'market-state': 'research_artifact',
    'trading-orchestrator': 'orchestration',
    'exchange-scope': 'policy_input',
  });

/** Command Center has no Nest boundary file — catalog-only (RC-20). */
export const COMMAND_CENTER_FORBIDDEN_RESPONSIBILITIES = Object.freeze([
  'submit-order',
  'approve-risk',
  'certify-strategy',
  'ui-only-kill',
  'become-source-of-truth',
  'authoritative-finance-cache',
] as const);

export const V2_APPROVED_PORTS: Readonly<Record<V2PlatformModuleId, readonly string[]>> =
  Object.freeze({
    'command-center': Object.freeze(['BotFacadeService']),
    'knowledge-lake': Object.freeze(['KNOWLEDGE_LAKE_INGESTION_PORT', 'KNOWLEDGE_LAKE_QUERY_PORT']),
    'strategy-library': Object.freeze([
      'STRATEGY_LIBRARY_LOOKUP_PORT',
      'STRATEGY_LIBRARY_ELIGIBILITY_PORT',
    ]),
    'runtime-enforcement': Object.freeze(['RUNTIME_ENFORCEMENT_PORT']),
    reporting: Object.freeze(['REPORTING_SERVICE_PORT', 'REPORTING_QUERY_PORT']),
    'ai-analytics': Object.freeze(['AI_ANALYTICS_PORT']),
    'notification-delivery': Object.freeze(['NOTIFICATION_SERVICE_PORT']),
    'market-qualification': Object.freeze([
      'MARKET_QUALIFICATION_SERVICE_PORT',
      'MARKET_QUALIFICATION_QUERY_PORT',
      'MARKET_QUALIFICATION_CONSUMER_READ_PORT',
    ]),
    'market-profile': Object.freeze([
      'MARKET_PROFILE_SERVICE_PORT',
      'MARKET_PROFILE_QUERY_PORT',
      'MARKET_PROFILE_CONSUMER_READ_PORT',
    ]),
    'market-state': Object.freeze([
      'MARKET_STATE_SERVICE_PORT',
      'MARKET_STATE_QUERY_PORT',
      'MARKET_STATE_CONSUMER_READ_PORT',
    ]),
    'trading-orchestrator': Object.freeze([
      'TRADING_ORCHESTRATOR_SERVICE_PORT',
      'TRADING_ORCHESTRATOR_QUERY_PORT',
      'TRADING_ORCHESTRATOR_CONSUMER_READ_PORT',
    ]),
    'exchange-scope': Object.freeze([
      'EXCHANGE_SCOPE_SERVICE_PORT',
      'EXCHANGE_SCOPE_QUERY_PORT',
      'EXCHANGE_SCOPE_CONSUMER_READ_PORT',
    ]),
  });

export const V2_APPROVED_PORT_FILES = Object.freeze({
  BotFacadeService: 'src/modules/bot-facade/bot-facade.service.ts',
  KNOWLEDGE_LAKE_INGESTION_PORT:
    'src/modules/knowledge-lake/ports/knowledge-lake-ingestion.port.ts',
  KNOWLEDGE_LAKE_QUERY_PORT: 'src/modules/knowledge-lake/ports/knowledge-lake-query.port.ts',
  STRATEGY_LIBRARY_LOOKUP_PORT:
    'src/modules/strategy-library/ports/strategy-library-lookup.port.ts',
  STRATEGY_LIBRARY_ELIGIBILITY_PORT:
    'src/modules/strategy-library/ports/strategy-library-eligibility.port.ts',
  RUNTIME_ENFORCEMENT_PORT: 'src/modules/runtime-enforcement/ports/runtime-enforcement.port.ts',
  REPORTING_SERVICE_PORT: 'src/modules/reporting/ports/reporting.port.ts',
  REPORTING_QUERY_PORT: 'src/modules/reporting/ports/reporting.port.ts',
  AI_ANALYTICS_PORT: 'src/modules/ai-analytics/ports/ai-analytics.port.ts',
  NOTIFICATION_SERVICE_PORT: 'src/modules/notification-delivery/ports/notification.port.ts',
  MARKET_QUALIFICATION_SERVICE_PORT:
    'src/modules/market-qualification/ports/market-qualification.port.ts',
  MARKET_QUALIFICATION_QUERY_PORT:
    'src/modules/market-qualification/ports/market-qualification.port.ts',
  MARKET_QUALIFICATION_CONSUMER_READ_PORT:
    'src/modules/market-qualification/ports/market-qualification-consumer.port.ts',
  MARKET_PROFILE_SERVICE_PORT: 'src/modules/market-profile/ports/market-profile.port.ts',
  MARKET_PROFILE_QUERY_PORT: 'src/modules/market-profile/ports/market-profile.port.ts',
  MARKET_PROFILE_CONSUMER_READ_PORT:
    'src/modules/market-profile/ports/market-profile-consumer.port.ts',
  MARKET_STATE_SERVICE_PORT: 'src/modules/market-state/ports/market-state.port.ts',
  MARKET_STATE_QUERY_PORT: 'src/modules/market-state/ports/market-state.port.ts',
  MARKET_STATE_CONSUMER_READ_PORT: 'src/modules/market-state/ports/market-state.port.ts',
  TRADING_ORCHESTRATOR_SERVICE_PORT:
    'src/modules/trading-orchestrator/ports/trading-orchestrator.port.ts',
  TRADING_ORCHESTRATOR_QUERY_PORT:
    'src/modules/trading-orchestrator/ports/trading-orchestrator.port.ts',
  TRADING_ORCHESTRATOR_CONSUMER_READ_PORT:
    'src/modules/trading-orchestrator/ports/trading-orchestrator.port.ts',
  EXCHANGE_SCOPE_SERVICE_PORT: 'src/modules/exchange-scope/ports/exchange-scope.port.ts',
  EXCHANGE_SCOPE_QUERY_PORT: 'src/modules/exchange-scope/ports/exchange-scope.port.ts',
  EXCHANGE_SCOPE_CONSUMER_READ_PORT: 'src/modules/exchange-scope/ports/exchange-scope.port.ts',
} as const);

const NEST_BOUNDARIES = Object.freeze({
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

export type V2AuthorityRecord = Readonly<{
  moduleId: V2PlatformModuleId;
  authorityClass: string;
  matrixPrimaryClass: V2MatrixPrimaryClass;
  ownedResponsibilities: readonly string[];
  forbiddenResponsibilities: readonly string[];
  allowedConsumers: readonly V2PlatformModuleId[];
  forbiddenConsumers: readonly V2PlatformModuleId[];
  approvedPorts: readonly string[];
  consumes: readonly V2PlatformModuleId[];
  mutatesTradingFinance: false;
}>;

function ownedResponsibilities(moduleId: V2PlatformModuleId): readonly string[] {
  if (moduleId === 'command-center') {
    return ['ops-workspace-projections', 'ops-command-entry'];
  }
  if (moduleId === 'knowledge-lake') {
    return ['analytical-warehouse'];
  }
  const boundary = NEST_BOUNDARIES[moduleId];
  return 'ownedConcerns' in boundary ? boundary.ownedConcerns : [];
}

function forbiddenResponsibilities(moduleId: V2PlatformModuleId): readonly string[] {
  if (moduleId === 'command-center') return COMMAND_CENTER_FORBIDDEN_RESPONSIBILITIES;
  return NEST_BOUNDARIES[moduleId as keyof typeof NEST_BOUNDARIES].forbiddenCapabilities;
}

function allowedConsumersOf(moduleId: V2PlatformModuleId): readonly V2PlatformModuleId[] {
  return V2_ALLOWED_CONSUME_EDGES.filter((edge) => edge.to === moduleId).map((edge) => edge.from);
}

function forbiddenConsumersOf(moduleId: V2PlatformModuleId): readonly V2PlatformModuleId[] {
  return V2_FORBIDDEN_REVERSE_EDGES.filter((edge) => edge.to === moduleId).map((edge) => edge.from);
}

function consumesOf(moduleId: V2PlatformModuleId): readonly V2PlatformModuleId[] {
  return V2_ALLOWED_CONSUME_EDGES.filter((edge) => edge.from === moduleId).map((edge) => edge.to);
}

export const V2_AUTHORITY_GRAPH: Readonly<Record<V2PlatformModuleId, V2AuthorityRecord>> =
  Object.freeze(
    Object.fromEntries(
      V2_PLATFORM_MODULE_IDS.map((moduleId) => [
        moduleId,
        Object.freeze({
          moduleId,
          authorityClass: V2_PLATFORM_MODULE_CATALOG[moduleId].authorityClass,
          matrixPrimaryClass: V2_MATRIX_PRIMARY_CLASS[moduleId],
          ownedResponsibilities: ownedResponsibilities(moduleId),
          forbiddenResponsibilities: forbiddenResponsibilities(moduleId),
          allowedConsumers: allowedConsumersOf(moduleId),
          forbiddenConsumers: forbiddenConsumersOf(moduleId),
          approvedPorts: V2_APPROVED_PORTS[moduleId],
          consumes: consumesOf(moduleId),
          mutatesTradingFinance: false,
        }),
      ]),
    ) as Record<V2PlatformModuleId, V2AuthorityRecord>,
  );

export function authorityRecord(moduleId: V2PlatformModuleId): V2AuthorityRecord {
  return V2_AUTHORITY_GRAPH[moduleId];
}

export function modulesClaimingMatrixClass(
  matrixClass: V2MatrixPrimaryClass,
): readonly V2PlatformModuleId[] {
  return V2_PLATFORM_MODULE_IDS.filter((id) => V2_MATRIX_PRIMARY_CLASS[id] === matrixClass);
}
