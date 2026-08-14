/**
 * RC-28 Epic 5 — closed-RC compatibility matrix.
 *
 * Records already-shipped RC-19…RC-27 contracts. Does not add ports.
 */

export const V2_IDENTITY_KEYS = Object.freeze([
  'workspaceId',
  'exchangeScopeId',
  'tradingSessionId',
  'libraryEntryId',
] as const);

export type V2ClosedRcId =
  'RC-19' | 'RC-20' | 'RC-21' | 'RC-22' | 'RC-23' | 'RC-24' | 'RC-25' | 'RC-26' | 'RC-27';

export type V2CompatibilityRow = Readonly<{
  rc: V2ClosedRcId;
  theme: string;
  specSections: readonly string[];
  portTokens: readonly string[];
  identityKeys: readonly string[];
  identityFiles: readonly string[];
  paperFreeze: true;
  newInRc28: false;
}>;

export const V2_COMPATIBILITY_MATRIX: readonly V2CompatibilityRow[] = Object.freeze([
  Object.freeze({
    rc: 'RC-19',
    theme: 'Bot Facade + Exchange Scope identity',
    specSections: Object.freeze([
      '### 5.6 Trading Session and Strategy Runtime',
      '### 5.10 Exchange Scope (UI: Cluster)',
    ]),
    portTokens: Object.freeze(['BotFacadeService']),
    identityKeys: Object.freeze(['workspaceId', 'tradingSessionId', 'exchangeScopeId']),
    identityFiles: Object.freeze([
      'src/modules/bot-facade/bot-facade.service.ts',
      'src/modules/bot-facade/domain/bot-view.ts',
    ]),
    paperFreeze: true,
    newInRc28: false,
  }),
  Object.freeze({
    rc: 'RC-20',
    theme: 'Command Center foundation',
    specSections: Object.freeze(['### 5.16 Command Center and Dashboard']),
    portTokens: Object.freeze(['BotFacadeService']),
    identityKeys: Object.freeze(['workspaceId', 'tradingSessionId']),
    identityFiles: Object.freeze([
      'src/modules/bot-facade/bot-facade.service.ts',
      'src/modules/bot-facade/domain/bot-view.ts',
    ]),
    paperFreeze: true,
    newInRc28: false,
  }),
  Object.freeze({
    rc: 'RC-21',
    theme: 'Knowledge Lake',
    specSections: Object.freeze(['### 5.13 Knowledge Lake']),
    portTokens: Object.freeze(['KNOWLEDGE_LAKE_INGESTION_PORT', 'KNOWLEDGE_LAKE_QUERY_PORT']),
    identityKeys: Object.freeze(['workspaceId']),
    identityFiles: Object.freeze(['src/modules/knowledge-lake/ports/knowledge-lake-query.port.ts']),
    paperFreeze: true,
    newInRc28: false,
  }),
  Object.freeze({
    rc: 'RC-22',
    theme: 'Strategy Library',
    specSections: Object.freeze(['### 5.2 Strategy Library']),
    portTokens: Object.freeze([
      'STRATEGY_LIBRARY_LOOKUP_PORT',
      'STRATEGY_LIBRARY_ELIGIBILITY_PORT',
    ]),
    identityKeys: Object.freeze(['workspaceId', 'libraryEntryId']),
    identityFiles: Object.freeze([
      'src/modules/strategy-library/ports/strategy-library-lookup.port.ts',
      'src/modules/strategy-library/ports/strategy-library-eligibility.port.ts',
    ]),
    paperFreeze: true,
    newInRc28: false,
  }),
  Object.freeze({
    rc: 'RC-23',
    theme: 'Runtime Enforcement',
    specSections: Object.freeze([
      '### 5.2 Strategy Library',
      '### 5.6 Trading Session and Strategy Runtime',
    ]),
    portTokens: Object.freeze(['RUNTIME_ENFORCEMENT_PORT']),
    identityKeys: Object.freeze(['workspaceId', 'libraryEntryId', 'exchangeScopeId']),
    identityFiles: Object.freeze([
      'src/modules/runtime-enforcement/ports/runtime-enforcement.port.ts',
    ]),
    paperFreeze: true,
    newInRc28: false,
  }),
  Object.freeze({
    rc: 'RC-24',
    theme: 'Reporting / AI / Notification',
    specSections: Object.freeze([
      '### 5.14 Reporting',
      '### 5.15 AI Analyst / AI Assistant',
      '### 5.16 Command Center and Dashboard',
    ]),
    portTokens: Object.freeze([
      'REPORTING_SERVICE_PORT',
      'REPORTING_QUERY_PORT',
      'AI_ANALYTICS_PORT',
      'NOTIFICATION_SERVICE_PORT',
    ]),
    identityKeys: Object.freeze(['workspaceId']),
    identityFiles: Object.freeze([
      'src/modules/reporting/ports/reporting.port.ts',
      'src/modules/ai-analytics/ports/ai-analytics.port.ts',
      'src/modules/notification-delivery/ports/notification.port.ts',
    ]),
    paperFreeze: true,
    newInRc28: false,
  }),
  Object.freeze({
    rc: 'RC-25',
    theme: 'Market Qualification + Market Profile',
    specSections: Object.freeze(['### 5.3 Market Qualification and Market Profile']),
    portTokens: Object.freeze(['MARKET_QUALIFICATION_SERVICE_PORT', 'MARKET_PROFILE_SERVICE_PORT']),
    identityKeys: Object.freeze(['workspaceId', 'exchangeScopeId']),
    identityFiles: Object.freeze([
      'src/modules/market-qualification/ports/market-qualification.port.ts',
      'src/modules/market-profile/ports/market-profile.port.ts',
    ]),
    paperFreeze: true,
    newInRc28: false,
  }),
  Object.freeze({
    rc: 'RC-26',
    theme: 'Trading Orchestrator + Market State',
    specSections: Object.freeze(['### 5.4 Market State', '### 5.5 Trading Orchestrator']),
    portTokens: Object.freeze(['MARKET_STATE_SERVICE_PORT', 'TRADING_ORCHESTRATOR_SERVICE_PORT']),
    identityKeys: Object.freeze(['workspaceId', 'exchangeScopeId']),
    identityFiles: Object.freeze([
      'src/modules/market-state/ports/market-state.port.ts',
      'src/modules/trading-orchestrator/ports/trading-orchestrator.port.ts',
    ]),
    paperFreeze: true,
    newInRc28: false,
  }),
  Object.freeze({
    rc: 'RC-27',
    theme: 'Exchange Scope',
    specSections: Object.freeze(['### 5.10 Exchange Scope (UI: Cluster)']),
    portTokens: Object.freeze(['EXCHANGE_SCOPE_SERVICE_PORT', 'EXCHANGE_SCOPE_CONSUMER_READ_PORT']),
    identityKeys: Object.freeze(['workspaceId', 'exchangeScopeId']),
    identityFiles: Object.freeze(['src/modules/exchange-scope/ports/exchange-scope.port.ts']),
    paperFreeze: true,
    newInRc28: false,
  }),
]);
