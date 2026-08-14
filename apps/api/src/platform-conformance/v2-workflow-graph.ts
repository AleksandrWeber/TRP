/**
 * RC-28 Epic 2 — complete Version 2 business-workflow hop catalog.
 *
 * Each hop names an existing owner, an existing port, and an authority class.
 * This file does not add ports, workflows, or business logic.
 */

export const V2_WORKFLOW_NODE_IDS = Object.freeze([
  'research-lab',
  'strategy-library',
  'runtime-enforcement',
  'trading-orchestrator',
  'trading-session',
  'orders',
  'execution',
  'accounting',
  'knowledge-lake',
  'reporting',
  'ai-analytics',
  'notification-delivery',
  'command-center',
] as const);

export type V2WorkflowNodeId = (typeof V2_WORKFLOW_NODE_IDS)[number];

export type V2WorkflowHop = Readonly<{
  hopId: string;
  from: V2WorkflowNodeId;
  to: V2WorkflowNodeId;
  contract: string;
  portToken: string;
  owner: string;
  authorityClass: string;
  consumerRole:
    | 'read-consume'
    | 'identity-key'
    | 'handoff-intent'
    | 'canonical-path'
    | 'append-projection'
    | 'delivery'
    | 'command-route'
    | 'certification-support';
  ownershipTransfer: false;
  hiddenDependency: false;
}>;

/**
 * Linear certified path from the RC-28 plan / API Contract §5.
 * Consume direction may be reverse of the hop (consumer reads owner).
 */
export const V2_WORKFLOW_HOPS: readonly V2WorkflowHop[] = Object.freeze([
  Object.freeze({
    hopId: 'research-to-library',
    from: 'research-lab',
    to: 'strategy-library',
    contract: 'Strategy Library lookup / eligibility / certification (Library SoT)',
    portToken: 'STRATEGY_LIBRARY_LOOKUP_PORT',
    owner: 'Strategy Library',
    authorityClass: 'source_of_truth',
    consumerRole: 'certification-support',
    ownershipTransfer: false,
    hiddenDependency: false,
  }),
  Object.freeze({
    hopId: 'library-to-enforcement',
    from: 'strategy-library',
    to: 'runtime-enforcement',
    contract: 'RuntimeEnforcementPort.validateDeployment over Library reads',
    portToken: 'RUNTIME_ENFORCEMENT_PORT',
    owner: 'Runtime Enforcement',
    authorityClass: 'gate',
    consumerRole: 'read-consume',
    ownershipTransfer: false,
    hiddenDependency: false,
  }),
  Object.freeze({
    hopId: 'enforcement-to-orchestrator',
    from: 'runtime-enforcement',
    to: 'trading-orchestrator',
    contract: 'Orchestrator consumes validateDeployment before Session handoff intent',
    portToken: 'TRADING_ORCHESTRATOR_SERVICE_PORT',
    owner: 'Trading Orchestrator',
    authorityClass: 'orchestration_artifact',
    consumerRole: 'read-consume',
    ownershipTransfer: false,
    hiddenDependency: false,
  }),
  Object.freeze({
    hopId: 'orchestrator-to-session',
    from: 'trading-orchestrator',
    to: 'trading-session',
    contract: 'Session handoff intent only — Session remains lifecycle SoT',
    portToken: 'TRADING_ORCHESTRATOR_SERVICE_PORT',
    owner: 'Trading Session',
    authorityClass: 'session_lifecycle',
    consumerRole: 'handoff-intent',
    ownershipTransfer: false,
    hiddenDependency: false,
  }),
  Object.freeze({
    hopId: 'session-to-orders',
    from: 'trading-session',
    to: 'orders',
    contract: 'Canonical order path — Orders remain order-lifecycle SoT',
    portToken: 'CANONICAL_ORDER_PATH_PORT',
    owner: 'Orders',
    authorityClass: 'source_of_truth',
    consumerRole: 'canonical-path',
    ownershipTransfer: false,
    hiddenDependency: false,
  }),
  Object.freeze({
    hopId: 'orders-to-execution',
    from: 'orders',
    to: 'execution',
    contract: 'Canonical order path — Execution Engine remains submit SoT',
    portToken: 'CANONICAL_ORDER_PATH_PORT',
    owner: 'Execution Engine',
    authorityClass: 'source_of_truth',
    consumerRole: 'canonical-path',
    ownershipTransfer: false,
    hiddenDependency: false,
  }),
  Object.freeze({
    hopId: 'execution-to-accounting',
    from: 'execution',
    to: 'accounting',
    contract: 'Fill → Position → Ledger — Accounting remains money SoT',
    portToken: 'CANONICAL_ORDER_PATH_PORT',
    owner: 'Accounting',
    authorityClass: 'source_of_truth',
    consumerRole: 'canonical-path',
    ownershipTransfer: false,
    hiddenDependency: false,
  }),
  Object.freeze({
    hopId: 'accounting-to-lake',
    from: 'accounting',
    to: 'knowledge-lake',
    contract: 'KnowledgeLakeIngestionPort append-only projection',
    portToken: 'KNOWLEDGE_LAKE_INGESTION_PORT',
    owner: 'Knowledge Lake',
    authorityClass: 'projection',
    consumerRole: 'append-projection',
    ownershipTransfer: false,
    hiddenDependency: false,
  }),
  Object.freeze({
    hopId: 'lake-to-reporting',
    from: 'knowledge-lake',
    to: 'reporting',
    contract: 'KnowledgeLakeQueryPort consumed by Reporting (read only)',
    portToken: 'KNOWLEDGE_LAKE_QUERY_PORT',
    owner: 'Reporting',
    authorityClass: 'projection',
    consumerRole: 'read-consume',
    ownershipTransfer: false,
    hiddenDependency: false,
  }),
  Object.freeze({
    hopId: 'reporting-to-ai',
    from: 'reporting',
    to: 'ai-analytics',
    contract: 'ReportingQueryPort consumed by AI Analytics (narrative only)',
    portToken: 'REPORTING_QUERY_PORT',
    owner: 'AI Analytics',
    authorityClass: 'narrative',
    consumerRole: 'read-consume',
    ownershipTransfer: false,
    hiddenDependency: false,
  }),
  Object.freeze({
    hopId: 'ai-to-notification',
    from: 'ai-analytics',
    to: 'notification-delivery',
    contract: 'NotificationServicePort.deliver — delivery only, never control plane',
    portToken: 'NOTIFICATION_SERVICE_PORT',
    owner: 'Notification Delivery',
    authorityClass: 'notification-projection',
    consumerRole: 'delivery',
    ownershipTransfer: false,
    hiddenDependency: false,
  }),
  Object.freeze({
    hopId: 'notification-to-command-center',
    from: 'notification-delivery',
    to: 'command-center',
    contract: 'Command Center projections + BotFacadeService → Trading Session',
    portToken: 'BotFacadeService',
    owner: 'Command Center',
    authorityClass: 'command_ui_projection',
    consumerRole: 'command-route',
    ownershipTransfer: false,
    hiddenDependency: false,
  }),
]);

export const V2_WORKFLOW_CONTRACT_FILES = Object.freeze({
  STRATEGY_LIBRARY_LOOKUP_PORT:
    'src/modules/strategy-library/ports/strategy-library-lookup.port.ts',
  RUNTIME_ENFORCEMENT_PORT: 'src/modules/runtime-enforcement/ports/runtime-enforcement.port.ts',
  TRADING_ORCHESTRATOR_SERVICE_PORT:
    'src/modules/trading-orchestrator/ports/trading-orchestrator.port.ts',
  CANONICAL_ORDER_PATH_PORT: 'src/modules/canonical-order-path/canonical-order-path.service.ts',
  KNOWLEDGE_LAKE_INGESTION_PORT:
    'src/modules/knowledge-lake/ports/knowledge-lake-ingestion.port.ts',
  KNOWLEDGE_LAKE_QUERY_PORT: 'src/modules/knowledge-lake/ports/knowledge-lake-query.port.ts',
  REPORTING_QUERY_PORT: 'src/modules/reporting/ports/reporting.port.ts',
  NOTIFICATION_SERVICE_PORT: 'src/modules/notification-delivery/ports/notification.port.ts',
  BotFacadeService: 'src/modules/bot-facade/bot-facade.service.ts',
} as const);

export function workflowSequence(): readonly V2WorkflowNodeId[] {
  return [V2_WORKFLOW_HOPS[0]!.from, ...V2_WORKFLOW_HOPS.map((hop) => hop.to)];
}

export function hopById(hopId: string): V2WorkflowHop | undefined {
  return V2_WORKFLOW_HOPS.find((hop) => hop.hopId === hopId);
}
