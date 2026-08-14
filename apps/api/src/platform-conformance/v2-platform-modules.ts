/**
 * RC-28 Epic 1 — frozen catalog of Version 2 integration surfaces.
 *
 * Not a Nest module. Not a Source of Truth. Composes closed RC-20…RC-27 owners.
 */

export const V2_PLATFORM_MODULE_IDS = Object.freeze([
  'command-center',
  'knowledge-lake',
  'strategy-library',
  'runtime-enforcement',
  'reporting',
  'ai-analytics',
  'notification-delivery',
  'market-qualification',
  'market-profile',
  'market-state',
  'trading-orchestrator',
  'exchange-scope',
] as const);

export type V2PlatformModuleId = (typeof V2_PLATFORM_MODULE_IDS)[number];

export type V2PlatformModuleRecord = Readonly<{
  moduleId: V2PlatformModuleId;
  closedRc: string;
  nestDir: string | null;
  nestModuleSymbol: string | null;
  webDir: string | null;
  authorityClass: string;
  owner: string;
  isolationRole: 'engine' | 'projection' | 'narrative' | 'delivery' | 'command-ui' | 'isolation';
}>;

export const V2_PLATFORM_MODULE_CATALOG: Readonly<
  Record<V2PlatformModuleId, V2PlatformModuleRecord>
> = Object.freeze({
  'command-center': Object.freeze({
    moduleId: 'command-center',
    closedRc: 'RC-20',
    nestDir: null,
    nestModuleSymbol: null,
    webDir: 'apps/web/src/command-center',
    authorityClass: 'command_ui_projection',
    owner: 'Command Center',
    isolationRole: 'command-ui',
  }),
  'knowledge-lake': Object.freeze({
    moduleId: 'knowledge-lake',
    closedRc: 'RC-21',
    nestDir: 'src/modules/knowledge-lake',
    nestModuleSymbol: 'KnowledgeLakeModule',
    webDir: null,
    authorityClass: 'projection',
    owner: 'Knowledge Lake',
    isolationRole: 'projection',
  }),
  'strategy-library': Object.freeze({
    moduleId: 'strategy-library',
    closedRc: 'RC-22',
    nestDir: 'src/modules/strategy-library',
    nestModuleSymbol: 'StrategyLibraryModule',
    webDir: null,
    authorityClass: 'source_of_truth',
    owner: 'Strategy Library',
    isolationRole: 'engine',
  }),
  'runtime-enforcement': Object.freeze({
    moduleId: 'runtime-enforcement',
    closedRc: 'RC-23',
    nestDir: 'src/modules/runtime-enforcement',
    nestModuleSymbol: 'RuntimeEnforcementModule',
    webDir: null,
    authorityClass: 'gate',
    owner: 'Runtime Enforcement',
    isolationRole: 'engine',
  }),
  reporting: Object.freeze({
    moduleId: 'reporting',
    closedRc: 'RC-24',
    nestDir: 'src/modules/reporting',
    nestModuleSymbol: 'ReportingModule',
    webDir: null,
    authorityClass: 'projection',
    owner: 'Reporting',
    isolationRole: 'projection',
  }),
  'ai-analytics': Object.freeze({
    moduleId: 'ai-analytics',
    closedRc: 'RC-24',
    nestDir: 'src/modules/ai-analytics',
    nestModuleSymbol: 'AiAnalyticsModule',
    webDir: null,
    authorityClass: 'narrative',
    owner: 'AI Analytics',
    isolationRole: 'narrative',
  }),
  'notification-delivery': Object.freeze({
    moduleId: 'notification-delivery',
    closedRc: 'RC-24',
    nestDir: 'src/modules/notification-delivery',
    nestModuleSymbol: 'NotificationDeliveryModule',
    webDir: null,
    authorityClass: 'notification-projection',
    owner: 'Notification Delivery',
    isolationRole: 'delivery',
  }),
  'market-qualification': Object.freeze({
    moduleId: 'market-qualification',
    closedRc: 'RC-25',
    nestDir: 'src/modules/market-qualification',
    nestModuleSymbol: 'MarketQualificationModule',
    webDir: null,
    authorityClass: 'research_artifact',
    owner: 'Market Qualification',
    isolationRole: 'engine',
  }),
  'market-profile': Object.freeze({
    moduleId: 'market-profile',
    closedRc: 'RC-25',
    nestDir: 'src/modules/market-profile',
    nestModuleSymbol: 'MarketProfileModule',
    webDir: null,
    authorityClass: 'research_artifact',
    owner: 'Market Profile',
    isolationRole: 'engine',
  }),
  'market-state': Object.freeze({
    moduleId: 'market-state',
    closedRc: 'RC-26',
    nestDir: 'src/modules/market-state',
    nestModuleSymbol: 'MarketStateModule',
    webDir: null,
    authorityClass: 'market_state_artifact',
    owner: 'Market State',
    isolationRole: 'engine',
  }),
  'trading-orchestrator': Object.freeze({
    moduleId: 'trading-orchestrator',
    closedRc: 'RC-26',
    nestDir: 'src/modules/trading-orchestrator',
    nestModuleSymbol: 'TradingOrchestratorModule',
    webDir: null,
    authorityClass: 'orchestration_artifact',
    owner: 'Trading Orchestrator',
    isolationRole: 'engine',
  }),
  'exchange-scope': Object.freeze({
    moduleId: 'exchange-scope',
    closedRc: 'RC-27',
    nestDir: 'src/modules/exchange-scope',
    nestModuleSymbol: 'ExchangeScopeModule',
    webDir: null,
    authorityClass: 'exchange_scope_artifact',
    owner: 'Exchange Scope',
    isolationRole: 'isolation',
  }),
});

export const V2_NEST_MODULE_IDS = V2_PLATFORM_MODULE_IDS.filter(
  (id) => V2_PLATFORM_MODULE_CATALOG[id].nestDir !== null,
);

export function isV2PlatformModuleId(value: string): value is V2PlatformModuleId {
  return (V2_PLATFORM_MODULE_IDS as readonly string[]).includes(value);
}
