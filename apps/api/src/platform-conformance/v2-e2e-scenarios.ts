/**
 * RC-28 Epic 4 — end-to-end scenario catalog.
 *
 * Names existing ports and owners for representative Version 2 journeys.
 * This file does not add workflows, APIs, or business logic.
 */

export const V2_E2E_SCENARIO_IDS = Object.freeze([
  'certified-strategy-deployment',
  'successful-paper-trading-session',
  'rejected-deployment-gate-fail',
  'cross-exchange-isolation',
  'reporting-generation',
  'ai-narrative-generation',
  'notification-delivery',
  'command-center-monitoring',
] as const);

export type V2E2EScenarioId = (typeof V2_E2E_SCENARIO_IDS)[number];

export type V2E2EScenario = Readonly<{
  scenarioId: V2E2EScenarioId;
  title: string;
  path: readonly string[];
  ports: readonly string[];
  expectedOutcome:
    'pass' | 'fail-closed' | 'projection' | 'delivery' | 'command-route' | 'isolation';
  ownershipTransfer: false;
  newApi: false;
}>;

export const V2_E2E_SCENARIOS: readonly V2E2EScenario[] = Object.freeze([
  Object.freeze({
    scenarioId: 'certified-strategy-deployment',
    title: 'Certified strategy passes Gate and Orchestrator Session handoff intent',
    path: Object.freeze([
      'research-lab',
      'strategy-library',
      'runtime-enforcement',
      'trading-orchestrator',
    ]),
    ports: Object.freeze([
      'STRATEGY_LIBRARY_LOOKUP_PORT',
      'RUNTIME_ENFORCEMENT_PORT',
      'TRADING_ORCHESTRATOR_SERVICE_PORT',
    ]),
    expectedOutcome: 'pass',
    ownershipTransfer: false,
    newApi: false,
  }),
  Object.freeze({
    scenarioId: 'successful-paper-trading-session',
    title: 'Paper Session remains lifecycle SoT; money path is Canonical Order Path',
    path: Object.freeze(['trading-session', 'orders', 'execution', 'accounting']),
    ports: Object.freeze(['BotFacadeService', 'CANONICAL_ORDER_PATH_PORT']),
    expectedOutcome: 'pass',
    ownershipTransfer: false,
    newApi: false,
  }),
  Object.freeze({
    scenarioId: 'rejected-deployment-gate-fail',
    title: 'Uncertified / Gate-fail paths never start Sessions or submit orders',
    path: Object.freeze(['strategy-library', 'runtime-enforcement', 'trading-orchestrator']),
    ports: Object.freeze(['RUNTIME_ENFORCEMENT_PORT', 'TRADING_ORCHESTRATOR_SERVICE_PORT']),
    expectedOutcome: 'fail-closed',
    ownershipTransfer: false,
    newApi: false,
  }),
  Object.freeze({
    scenarioId: 'cross-exchange-isolation',
    title: 'Cross-scope funds / capacity / policy mixing is rejected',
    path: Object.freeze(['exchange-scope']),
    ports: Object.freeze(['EXCHANGE_SCOPE_SERVICE_PORT', 'EXCHANGE_SCOPE_CONSUMER_READ_PORT']),
    expectedOutcome: 'isolation',
    ownershipTransfer: false,
    newApi: false,
  }),
  Object.freeze({
    scenarioId: 'reporting-generation',
    title: 'Lake facts materialize as labeled paper report projections',
    path: Object.freeze(['knowledge-lake', 'reporting']),
    ports: Object.freeze(['KNOWLEDGE_LAKE_QUERY_PORT', 'REPORTING_SERVICE_PORT']),
    expectedOutcome: 'projection',
    ownershipTransfer: false,
    newApi: false,
  }),
  Object.freeze({
    scenarioId: 'ai-narrative-generation',
    title: 'AI narratives consume Reporting query only',
    path: Object.freeze(['reporting', 'ai-analytics']),
    ports: Object.freeze(['REPORTING_QUERY_PORT', 'AI_ANALYTICS_PORT']),
    expectedOutcome: 'projection',
    ownershipTransfer: false,
    newApi: false,
  }),
  Object.freeze({
    scenarioId: 'notification-delivery',
    title: 'Completed report/alert can be delivered; channel is not a control plane',
    path: Object.freeze(['ai-analytics', 'notification-delivery']),
    ports: Object.freeze(['NOTIFICATION_SERVICE_PORT']),
    expectedOutcome: 'delivery',
    ownershipTransfer: false,
    newApi: false,
  }),
  Object.freeze({
    scenarioId: 'command-center-monitoring',
    title: 'Command Center pause/stop route to Session APIs; UI cache never wins',
    path: Object.freeze(['notification-delivery', 'command-center']),
    ports: Object.freeze(['BotFacadeService']),
    expectedOutcome: 'command-route',
    ownershipTransfer: false,
    newApi: false,
  }),
]);
