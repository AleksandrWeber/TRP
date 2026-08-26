import {
  clearAccessToken,
  getAccessToken,
  getActiveWorkspace,
  getCsrfToken,
  setAccessToken,
  setCsrfToken,
} from './auth';
import { mapHttpError } from './mapApiError';

const apiUrl = import.meta.env.VITE_API_URL ?? 'http://localhost:3000';
/** Nest URI versioning prefix (US114). Health remains unversioned. */
const API_PREFIX = '/v1';

export type ConnectionType = 'EXCHANGE' | 'NOTIFICATION' | 'AI';
export type ConnectionProvider = 'BINANCE' | 'BYBIT' | 'OKX' | 'TELEGRAM' | 'SMTP' | 'OPENROUTER';
export type ExchangeProviderCapability =
  'SPOT' | 'FUTURES' | 'TESTNET' | 'MARGIN' | 'WEBSOCKET' | 'REST';
export type ExchangeProviderAvailability = 'AVAILABLE' | 'UNAVAILABLE';
export type ExchangeSessionState =
  | 'DISCONNECTED'
  | 'PENDING_VALIDATION'
  | 'CONNECTED'
  | 'SESSION_EXPIRED'
  | 'CONNECTION_LOST'
  | 'PROVIDER_UNAVAILABLE'
  | 'VALIDATION_FAILED'
  | 'AUTHENTICATION_FAILED';
export type ExchangeHealthProjection =
  'HEALTHY' | 'UNAVAILABLE' | 'EXPIRED' | 'AUTHENTICATION_FAILED' | 'CONNECTION_LOST';
export type ExchangeProviderAvailabilityObservation = 'AVAILABLE' | 'UNAVAILABLE' | 'UNKNOWN';
export type ExchangeSessionCapability =
  'SPOT' | 'MARGIN' | 'FUTURES' | 'TESTNET' | 'REST' | 'WEBSOCKET' | 'WITHDRAW' | 'DEPOSIT';
export type ExchangeCapabilityState =
  'SUPPORTED' | 'UNSUPPORTED' | 'UNAVAILABLE' | 'UNKNOWN' | 'VERIFICATION_FAILED';

export type ExchangeSessionView = {
  state: ExchangeSessionState;
  health: ExchangeHealthProjection | null;
  reconnectRequired: boolean;
  reconnectAllowed: boolean;
  providerAvailability: ExchangeProviderAvailabilityObservation;
};

export type ExchangeVerifiedCapability = {
  capability: ExchangeSessionCapability;
  state: ExchangeCapabilityState;
};

export type ExchangeCapabilityView = {
  capabilities: ExchangeVerifiedCapability[];
  verifiedAt: string | null;
  verificationFailed: boolean;
};

export type ExchangeProviderMetadata = {
  id: string;
  displayName: string;
  category: 'EXCHANGE';
  capabilities: ExchangeProviderCapability[];
  availability: ExchangeProviderAvailability;
};

export type ConnectionCatalogView = {
  connectionTypes: Array<{
    id: ConnectionType;
    displayName: string;
    providers: Array<{
      id: ConnectionProvider;
      displayName: string;
      credentialFields: string[];
      capabilities?: ExchangeProviderCapability[];
      availability?: ExchangeProviderAvailability;
      category?: 'EXCHANGE';
    }>;
  }>;
  exchangeProviders: ExchangeProviderMetadata[];
};

export type ConnectionMetadataView = {
  id: string;
  workspaceId: string;
  displayName: string;
  provider: ConnectionProvider;
  connectionType: ConnectionType;
  status:
    | 'DISCONNECTED'
    | 'PENDING_VALIDATION'
    | 'CONNECTED'
    | 'VALIDATION_FAILED'
    | 'HANDSHAKE_TIMEOUT'
    | 'PROVIDER_UNAVAILABLE'
    | 'AUTHENTICATION_FAILED'
    | 'SESSION_EXPIRED'
    | 'CONNECTION_LOST'
    | 'DISABLED'
    | 'REVOKED';
  credentialsStored: boolean;
  exchangeProvider: ExchangeProviderMetadata | null;
  session: ExchangeSessionView | null;
  capabilities: ExchangeCapabilityView | null;
  createdAt: string;
  updatedAt: string;
};

export type MarketDataProviderCatalogView = {
  providers: Array<{
    id: string;
    displayName: string;
    capabilities: string[];
    availability: string;
  }>;
};

export type MarketSymbolView = {
  exchangeSymbol: string;
  normalizedSymbol: string;
  baseAsset: string;
  quoteAsset: string;
  tradingStatus: string;
  providerId: string;
};

export type MarketSymbolDiscoveryView = {
  connectionId: string;
  providerId: string;
  discoveredAt: string;
  symbols: MarketSymbolView[];
  outcome: 'COMPLETED' | 'FAILED' | 'PROVIDER_UNAVAILABLE' | 'NOT_IMPLEMENTED';
  failureReason: string | null;
};

export type MarketTickerFreshness = 'FRESH' | 'STALE' | 'UNAVAILABLE' | 'UNKNOWN';

export type MarketTickerFieldsView = {
  normalizedSymbol: string;
  lastPrice: string;
  bid: string;
  ask: string;
  changePercent24h: string;
  high24h: string;
  low24h: string;
  volume24h: string;
  exchangeTimestamp: string;
  retrievalTimestamp: string;
  providerId: string;
  freshness: MarketTickerFreshness;
};

export type MarketTickerRetrievalView = {
  connectionId: string;
  providerId: string;
  exchangeSymbol: string;
  ticker: MarketTickerFieldsView | null;
  freshness: MarketTickerFreshness;
  outcome: 'COMPLETED' | 'FAILED' | 'PROVIDER_UNAVAILABLE' | 'NOT_IMPLEMENTED';
  failureReason: string | null;
};

export type MarketCandleInterval = '1m' | '5m' | '15m' | '1h' | '4h' | '1d';
export type MarketCandleFreshness = 'FRESH' | 'STALE' | 'UNAVAILABLE' | 'UNKNOWN';

export type MarketCandleFieldsView = {
  normalizedSymbol: string;
  interval: MarketCandleInterval;
  openTime: string;
  closeTime: string;
  open: string;
  high: string;
  low: string;
  close: string;
  volume: string;
  tradeCount: number | null;
  exchangeTimestamp: string;
  retrievalTimestamp: string;
  providerId: string;
};

export type MarketCandleRetrievalView = {
  connectionId: string;
  providerId: string;
  exchangeSymbol: string;
  interval: MarketCandleInterval | string;
  rangeStart: string;
  rangeEnd: string;
  candles: MarketCandleFieldsView[];
  freshness: MarketCandleFreshness;
  outcome: 'COMPLETED' | 'FAILED' | 'PROVIDER_UNAVAILABLE' | 'NOT_IMPLEMENTED';
  failureReason: string | null;
};

export type MarketOrderBookDepth = 10 | 20 | 50 | 100;
export type MarketOrderBookFreshness = 'FRESH' | 'STALE' | 'UNAVAILABLE' | 'UNKNOWN';

export type MarketOrderBookLevelView = {
  price: string;
  quantity: string;
};

export type MarketOrderBookFieldsView = {
  normalizedSymbol: string;
  depthLimit: MarketOrderBookDepth;
  bids: MarketOrderBookLevelView[];
  asks: MarketOrderBookLevelView[];
  exchangeTimestamp: string | null;
  retrievalTimestamp: string;
  providerId: string;
  freshness: MarketOrderBookFreshness;
};

export type MarketOrderBookRetrievalView = {
  connectionId: string;
  providerId: string;
  exchangeSymbol: string;
  depthLimit: MarketOrderBookDepth | number;
  orderBook: MarketOrderBookFieldsView | null;
  freshness: MarketOrderBookFreshness;
  outcome: 'COMPLETED' | 'FAILED' | 'PROVIDER_UNAVAILABLE' | 'NOT_IMPLEMENTED';
  failureReason: string | null;
};

export type Dataset = {
  id: string;
  symbol: string;
  timeframe: string;
  exchange: string;
  contentHash: string;
  barCount: number;
  startTime: string;
  endTime: string;
  gitCommit: string | null;
  createdAt: string;
  _count?: { experiments: number };
};

export type Experiment = {
  id: string;
  datasetId: string;
  strategyId: string;
  strategyVersion: string;
  configHash: string;
  gitCommit: string | null;
  verdict: 'pass' | 'fail' | 'needs_review';
  report: Record<string, unknown>;
  metrics: {
    totalReturnPercent: number;
    tradeCount: number;
    winRate: number;
    profitFactor: number;
    maxDrawdownPercent: number;
    expectancy: number;
    finalEquity: number;
  };
  validation: {
    verdict: string;
    reasons: string[];
    checks: Array<{ name: string; passed: boolean; value: number | string; threshold: string }>;
  };
  createdAt: string;
  dataset?: { symbol: string; timeframe: string; contentHash: string };
  deployment?: Deployment | null;
};

export type Deployment = {
  id: string;
  experimentId: string;
  strategyId: string;
  strategyVersion: string;
  symbol: string;
  timeframe: string;
  exchange: string;
  mode: string;
  status: string;
  approvedAt: string;
  position?: { side: string; quantity: number; entryPrice: number | null };
  experiment?: { verdict: string; configHash: string };
  _count?: { signals: number; executions: number };
};

export type Execution = {
  id: string;
  deploymentId: string;
  symbol: string;
  side: string;
  quantity: number;
  price: number;
  fee: number;
  mode: string;
  status: string;
  rejectReason: string | null;
  executedAt: string;
  signal?: { type: string; timestamp: string };
  deployment?: { symbol: string; strategyId: string };
};

export type Workflow = {
  id: string;
  type: string;
  status: string;
  context: Record<string, unknown>;
  error: string | null;
  createdAt: string;
  completedAt: string | null;
  steps: Array<{
    id: string;
    name: string;
    stepOrder: number;
    status: string;
    result: Record<string, unknown> | null;
    error: string | null;
  }>;
};

export type KnowledgeEntry = {
  id: string;
  type: string;
  title: string;
  description: string;
  category: string;
  tags: string[];
  version: number;
  validationStatus: string;
  createdAt: string;
};

export type CampaignRunRequest = {
  datasetId: string;
  strategyId: string;
  paramsList: Array<Record<string, string | number | boolean | null>>;
};

export type CampaignFailedRun = {
  params: Record<string, string | number | boolean | null>;
  error: string;
};

export type CampaignSummary = {
  campaignId: string;
  strategyId: string;
  datasetId: string;
  totalRuns: number;
  passCount: number;
  failCount: number;
  needsReviewCount: number;
  bestExperimentId: string | null;
  createdAt: string;
  failedRuns: CampaignFailedRun[];
};

export type CampaignHistorySessionView = {
  id: string;
  workspaceId: string;
  status: string;
  createdAt: string;
  completedAt?: string;
  report: Omit<CampaignSummary, 'failedRuns'> & {
    bestProfitFactor?: number | null;
    verdict?: string;
    recommendations?: string[];
  };
};

export type CampaignHistoryPageView = {
  items: CampaignHistorySessionView[];
  totalItems: number;
  totalPages: number;
  currentPage: number;
  pageSize: number;
};

export type MultiDatasetCampaignRequest = {
  strategyId: string;
  datasets: string[];
  paramsList: Array<Record<string, string | number | boolean | null>>;
};

export type MultiDatasetCampaignFailedDataset = {
  datasetId: string;
  error: string;
};

export type MultiDatasetCampaignSummary = {
  totalDatasets: number;
  completedDatasets: number;
  failedDatasets: number;
  campaignSummaries: CampaignSummary[];
  overallBestExperimentId: string | null;
  overallBestProfitFactor: number | null;
  failedDatasetErrors: MultiDatasetCampaignFailedDataset[];
};

export type WalkForwardWindowResult = {
  trainStart: number;
  trainEnd: number;
  testStart: number;
  testEnd: number;
  summary: CampaignSummary | null;
  error: string | null;
};

export type WalkForwardCampaignRequest = {
  datasetId: string;
  strategyId: string;
  paramsList: Array<Record<string, string | number | boolean | null>>;
  datasetLength: number;
  windowSize: number;
  stepSize: number;
};

export type WalkForwardCampaignSummary = {
  datasetId: string;
  strategyId: string;
  windowSize: number;
  stepSize: number;
  paramsCount: number;
  windowCount: number;
  successfulWindows: number;
  failedWindows: number;
  windows: WalkForwardWindowResult[];
  averageProfitFactor: number | null;
  averageReturnPercent: number | null;
  averageMaxDrawdownPercent: number | null;
  averageExpectancy: number | null;
  bestWindowIndex: number | null;
  worstWindowIndex: number | null;
  passCount: number | null;
  needsReviewCount: number | null;
  failCount: number | null;
  overallVerdict: 'PASS' | 'NEEDS_REVIEW' | 'FAIL';
};

export type ResearchAnalysis = {
  executiveSummary: string;
  strengths: string[];
  weaknesses: string[];
  recommendations: string[];
  nextHypothesis: string;
};

export type StrategyStatus = 'draft' | 'active' | 'archived';
export type StrategyTimeframe = '1m' | '5m' | '15m' | '1h' | '4h' | '1d';
export type StrategyDirection = 'LONG' | 'SHORT' | 'BOTH';
export type StrategyParameters = Record<string, unknown>;

export type Strategy = {
  id: string;
  workspaceId: string;
  name: string;
  description: string;
  status: StrategyStatus;
  tradingPair: string;
  timeframe: StrategyTimeframe;
  direction: StrategyDirection;
  positionSize: number;
  stopLossPercent: number;
  takeProfitPercent: number;
  parameters: StrategyParameters;
  createdAt: string;
  updatedAt: string;
};

export type CreateStrategyRequest = {
  name: string;
  tradingPair: string;
  timeframe: StrategyTimeframe;
  direction: StrategyDirection;
  description?: string;
  status?: StrategyStatus;
  positionSize?: number;
  stopLossPercent?: number;
  takeProfitPercent?: number;
  parameters?: StrategyParameters;
};

export type UpdateStrategyRequest = {
  name?: string;
  tradingPair?: string;
  timeframe?: StrategyTimeframe;
  direction?: StrategyDirection;
  description?: string;
  status?: StrategyStatus;
  positionSize?: number;
  stopLossPercent?: number;
  takeProfitPercent?: number;
  parameters?: StrategyParameters;
};

export type AuthUser = {
  id: string;
  email: string;
  role: string;
  displayName?: string;
  status?: string;
};

export type PeopleOperatorView = {
  id: string;
  email: string;
  displayName: string;
  role: string;
  status: string;
};

export type SignInSessionView = {
  id: string;
  current: boolean;
  device: string;
  browser: string;
  network: string | null;
  lastActiveAt: string;
  signedInAt: string;
};

export type LoginResponse = {
  accessToken: string;
  expiresIn: string;
  csrfToken: string;
  user: AuthUser;
};

export type WorkspaceView = {
  id: string;
  name: string;
  status: string;
  createdAt: string;
};

export type WorkspaceBootstrap = WorkspaceView;

export type LibraryMembershipStatus = 'uncertified' | 'certified' | 'deprecated' | 'archived';

export type StrategyLibraryRecordView = {
  authorityClass: 'source_of_truth';
  membershipStatus: LibraryMembershipStatus;
  strategy: {
    strategyFamilyId: string;
    name: string;
    description: string | null;
    registryRef: string | null;
    workspaceId: string;
    createdAt: string;
  };
  version: {
    libraryEntryId: string;
    strategyFamilyId: string;
    version: string;
    contentHash: string;
    market: string;
    supportedExchangeScopeIds: readonly string[];
    supportedTimeframes: readonly string[];
    supportedUniverse:
      | { kind: 'symbols'; symbols: readonly string[] }
      | { kind: 'universe-ref'; universeRef: string };
    workspaceId: string;
    createdAt: string;
    immutable: true;
  };
  certification: {
    certificationId: string;
    status: string;
    decision: string;
    certifiedAt: string;
    certifiedBy: string;
    notes: string | null;
    contentHash: string;
    evidence: readonly {
      evidenceId: string;
      type: string;
      sourceRef: { owner: string; id: string };
    }[];
  } | null;
  eligibility: {
    eligibilityId: string;
    outcome: string;
    reasons: readonly string[];
    rulesVersion: string;
    evaluatedAt: string;
  } | null;
  tacticalEnvelope: {
    envelopeVersion: string;
    allowedMarkets: readonly string[];
    allowedExchangeScopeIds: readonly string[];
    allowedSymbols: readonly string[];
    allowedTimeframes: readonly string[];
    riskPerTrade:
      { min: number; max: number; step?: number } | { kind: 'set'; values: readonly number[] };
    maxPositions: { min: number; max: number };
    parameterLimits: Readonly<Record<string, { min: number; max: number; step?: number }>>;
    executionConstraints: {
      maxOrdersPerDay?: number;
      allowedOrderTypes?: readonly string[];
    } | null;
    optionalFilters: readonly string[];
    provenanceRefs: readonly string[];
  } | null;
  envelopeState: 'present' | 'empty';
};

export type StrategyLibraryPageView = {
  authorityClass: 'source_of_truth';
  items: StrategyLibraryRecordView[];
  nextCursor: string | null;
};

export type StrategyLibraryEligibilityView = {
  outcome: 'eligible' | 'ineligible';
  reasons: readonly string[];
  status: LibraryMembershipStatus | 'unknown';
  checkedAt: string;
  libraryEntryId: string | null;
  eligibilityId: string | null;
};

export type CertificationAttemptView = {
  attemptId: string;
  workspaceId: string;
  outcome: 'certified' | 'rejected' | 'conflict';
  progress: 'complete';
  reasons: readonly string[];
  libraryEntryId: string | null;
  certificationId: string | null;
  certifiedBy: string;
  certifiedAt: string | null;
  createdAt: string;
  notes: string | null;
  metadata: {
    strategyFamilyId: string | null;
    name: string | null;
    version: string | null;
    contentHash: string | null;
    registryRef: string | null;
    evidenceTypes: readonly string[];
    envelopeVersion: string | null;
  };
};

export type CertificationHistoryView = {
  items: CertificationAttemptView[];
};

export type CertifyStrategyRequest = {
  family: {
    strategyFamilyId?: string;
    name: string;
    description?: string;
    registryRef?: string;
  };
  version: {
    version: string;
    contentHash: string;
    market: string;
    supportedExchangeScopeIds: readonly string[];
    supportedTimeframes: readonly string[];
    supportedSymbols?: readonly string[];
    universeRef?: string;
  };
  evidence: Array<{
    evidenceId: string;
    type: string;
    sourceRef: { owner: string; id: string };
    summary?: string;
  }>;
  tacticalEnvelope: {
    envelopeVersion: string;
    allowedMarkets: readonly string[];
    allowedExchangeScopeIds: readonly string[];
    allowedSymbols: readonly string[];
    allowedTimeframes: readonly string[];
    riskPerTrade:
      { min: number; max: number; step?: number } | { kind: 'set'; values: readonly number[] };
    maxPositions: { min: number; max: number };
  };
  notes?: string;
};

export type RuntimeValidationView = {
  validationId: string;
  workspaceId: string;
  progress: 'complete';
  outcome: 'pass' | 'fail';
  validation: 'VALID' | 'INVALID';
  reasons: readonly string[];
  libraryEntryId: string | null;
  strategyFamilyId: string | null;
  strategyVersion: string | null;
  strategyName: string | null;
  purpose: 'deployment_bind' | 'session_start';
  exchangeScopeId: string | null;
  certificationStatus: string | null;
  eligibilityOutcome: 'eligible' | 'ineligible' | 'unknown' | null;
  checkedAt: string;
  createdAt: string;
};

export type RuntimeValidationHistoryView = {
  items: RuntimeValidationView[];
};

export type RunRuntimeValidationRequest = {
  libraryEntryId?: string;
  strategyFamilyId?: string;
  strategyVersion?: string;
  exchangeScopeId?: string;
  purpose?: 'deployment_bind' | 'session_start';
};

export type DeploymentEnforcementAuthorizationView = {
  outcome: 'pass';
  validation: 'VALID';
  purpose: 'deployment_bind';
  libraryEntryId: string | null;
  certificationStatus: string | null;
  eligibilityOutcome: 'eligible' | 'ineligible' | 'unknown' | null;
  checkedAt: string;
  reasons: readonly string[];
};

export type StrategyDeploymentView = {
  id: string;
  workspaceId: string;
  exchangeScopeId: string;
  strategyId: string;
  strategyVersion: string;
  libraryEntryId: string | null;
  experimentId: string | null;
  parameters: Readonly<Record<string, unknown>>;
  instrument: string;
  timeframe: string;
  marketDataSourceId: string;
  paperExecutionConfigurationId: string;
  riskPolicyId: string;
  riskPolicyVersion: number;
  configurationHash: string;
  status: string;
  version: number;
  approvedAt: string | null;
  approvedByActorId: string | null;
  createdAt: string;
  recordedAt: string;
  actorId: string;
  correlationId: string | null;
  metadata: Readonly<Record<string, unknown>>;
  enforcementAuthorization: DeploymentEnforcementAuthorizationView | null;
};

export type CreateStrategyDeploymentRequest = {
  strategyId: string;
  strategyVersion: string;
  libraryEntryId?: string;
  experimentId?: string;
  parameters: Record<string, unknown>;
  instrument: string;
  timeframe: string;
  marketDataSourceId: string;
  paperExecutionConfigurationId: string;
  riskPolicyId: string;
  riskPolicyVersion: number;
  metadata?: Record<string, unknown>;
};

export type OrchestrationPlanView = {
  orchestrationPlanId: string;
  tradingOrchestratorId: string;
  workspaceId: string;
  exchangeScopeId: string;
  marketSymbol: string;
  modeContext: 'lab' | 'paper' | 'live';
  version: number;
  publishedAt: string;
  publishedBy: string;
  lifecycleStatus: string;
  lifecycleUpdatedAt: string;
  lifecycleReason: string;
  objective: string;
  rationaleSummary: string;
  inputSummary: string;
  authorityClass: 'orchestration_artifact';
  createsSession: false;
  forcesTrade: false;
  submitsOrders: false;
  approvesRisk: false;
};

export type OrchestrationPlanListView = {
  items: OrchestrationPlanView[];
};

export type OrchestrationRunView = {
  orchestrationRunId: string;
  workspaceId: string;
  exchangeScopeId: string;
  marketSymbol: string;
  modeContext: 'lab' | 'paper' | 'live';
  status: string;
  marketStateId: string;
  orchestrationPlanId: string | null;
  selectionDecisionId: string | null;
  sessionHandoffIntentId: string | null;
  objective: string | null;
  rejectionReasons: readonly string[];
  requiresConfirmation: boolean;
  createdAt: string;
  updatedAt: string;
  authorityClass: 'orchestration_artifact';
  forcesTrade: false;
  approvesRisk: false;
  submitsOrders: false;
  ownsSessionLifecycle: false;
};

export type SelectionDecisionView = {
  selectionDecisionId: string;
  orchestrationRunId: string;
  workspaceId: string;
  libraryEntryId: string;
  strategyVersionId: string;
  envelopeVersion: string;
  tacticPoint: Readonly<Record<string, unknown>>;
  selectedAt: string;
  authorityClass: 'orchestration_artifact';
  forcesTrade: false;
  inventsStrategy: false;
};

export type SessionHandoffIntentView = {
  sessionHandoffIntentId: string;
  orchestrationRunId: string;
  selectionDecisionId: string;
  workspaceId: string;
  deploymentBindRef: string;
  enforcementDecisionRef: string;
  status: string;
  proposedAt: string;
  authorityClass: 'orchestration_artifact';
  isOrder: false;
  isRiskDecision: false;
  createsSession: false;
};

export type OrchestrationRunDetailView = OrchestrationRunView & {
  selection: SelectionDecisionView | null;
  handoff: SessionHandoffIntentView | null;
};

export type OrchestrationHistoryView = {
  items: OrchestrationRunView[];
};

export type OrchestrationCommandView = {
  outcome: string;
  orchestrationRunId: string;
  selectionDecisionId?: string;
  sessionHandoffIntentId?: string;
  enforcementDecisionRef?: string;
  rejectionReasons?: readonly string[];
  authorityClass: 'orchestration_artifact';
  forcesTrade: false;
  approvesRisk: false;
  submitsOrders: false;
};

export type CreateOrchestrationPlanRequest = {
  marketSymbol: string;
  exchangeScopeId?: string;
  modeContext?: 'lab' | 'paper';
  objective: string;
  rationaleSummary?: string;
};

export type RequestOrchestrationRunRequest = {
  marketSymbol: string;
  exchangeScopeId?: string;
  modeContext?: 'lab' | 'paper';
  objective?: string;
  orchestrationPlanId?: string;
  marketStateId?: string;
  requiresConfirmation?: boolean;
};

export type ProposeOrchestrationSelectionRequest = {
  libraryEntryId: string;
  strategyVersionId: string;
  envelopeVersion: string;
  tacticPoint: Record<string, unknown>;
};

export type EmitOrchestrationHandoffRequest = {
  selectionDecisionId: string;
  deploymentBindRef: string;
};

export type ReportDefinitionView = {
  reportDefinitionId: string;
  workspaceId: string;
  name: string;
  description: string | null;
  kind: string;
  defaultModes: readonly string[];
  metricKeys: readonly string[];
  compareEnabled: boolean;
  createdAt: string;
  updatedAt: string | null;
  authorityClass: 'projection';
  ledgerSoT: false;
};

export type ReportDefinitionPageView = {
  items: ReportDefinitionView[];
  authorityClass: 'projection';
  ledgerSoT: false;
};

export type ReportRunListItemView = {
  reportRunId: string;
  workspaceId: string;
  reportDefinitionId: string;
  name: string;
  kind: string;
  status: string;
  modes: readonly string[];
  exchangeScopeId: string;
  tradingSessionId: string | null;
  libraryEntryId: string | null;
  windowFrom: string;
  windowTo: string;
  windowPreset: string | null;
  factCount: number;
  createdAt: string;
  deliveryOutcome: string | null;
  deliveryId: string | null;
  authorityClass: 'projection';
  ledgerSoT: false;
};

export type ReportRunPageView = {
  items: ReportRunListItemView[];
  authorityClass: 'projection';
  ledgerSoT: false;
};

export type ReportAggregationView = {
  sliceId: string;
  reportRunId: string;
  metricKey: string;
  mode: string | null;
  label: string;
  value: unknown;
  comparison: unknown;
  sourceRefs: readonly { ownerType: string; id: string }[];
  visualizationHint: string | null;
  authorityClass: 'projection';
};

export type ReportRunNarrativeView = {
  reportRunId: string;
  workspaceId: string;
  reportStatus: string | null;
  reportOutcome: string;
  narrativeId: string;
  narrativeKind: string;
  narrativeText: string;
  narrativeUnavailable: boolean;
  attached: true;
  reportMutated: false;
  forcesTrade: false;
  authorityClass: 'narrative';
};

export type ReportRunDeliveryView = {
  reportRunId: string;
  workspaceId: string;
  userId: string;
  reportStatus: string | null;
  reportOutcome: string;
  invoked: boolean;
  notInvokedReason?: string;
  notificationType: string | null;
  deliveryId: string | null;
  outcome: string;
  skipReasons: readonly string[];
  channelsAttempted: readonly string[];
  telegramAdapterReached: boolean;
  reservedChannelSkips: readonly string[];
  attached: true;
  reportMutated: false;
  generatesReports: false;
  channelActivated: false;
  forcesTrade: false;
  authorityClass: 'notification-projection';
};

export type ReportRunDetailView = ReportRunListItemView & {
  description: string | null;
  metricKeys: readonly string[];
  compareEnabled: boolean;
  rejectionReasons: readonly string[];
  sourceSummary: {
    factCount: number;
    lakeEventIds: readonly string[];
    sourceRefs: readonly { ownerType: string; id: string }[];
  };
  aggregations: readonly ReportAggregationView[];
  narrative: ReportRunNarrativeView | null;
  delivery: ReportRunDeliveryView | null;
  exportAvailable: true;
  exportKind: 'projection-json';
};

export type ReportRunListQuery = {
  reportDefinitionId?: string;
  kind?: string;
  status?: string;
  mode?: string;
  tradingSessionId?: string;
  q?: string;
  limit?: number;
};

export type KnowledgeLakeSourceRefView = {
  ownerType: string;
  id: string;
};

export type KnowledgeLakeListItemView = {
  entryId: string;
  eventId: string;
  workspaceId: string;
  producer: string;
  category: string;
  mode: string;
  occurredAt: string;
  admittedAt: string;
  exchangeScopeId: string;
  tradingSessionId: string | null;
  correlationId: string | null;
  sourceRef: KnowledgeLakeSourceRefView | null;
  schemaVersion: string;
  authorityClass: 'projection';
  ledgerSoT: false;
  analyticalCopy: true;
};

export type KnowledgeLakePageView = {
  items: KnowledgeLakeListItemView[];
  nextCursor: string | null;
  authorityClass: 'projection';
  ledgerSoT: false;
  analyticalCopy: true;
};

export type KnowledgeLakeRelationshipView = {
  kind: 'correlation' | 'session' | 'source-ref';
  relatedEntryId: string;
  reason: string;
  producer: string;
  category: string;
  authorityClass: 'projection';
};

export type KnowledgeLakeProvenanceView = {
  entryId: string;
  producer: string;
  occurredAt: string;
  admittedAt: string;
  schemaVersion: string;
  sourceRef: KnowledgeLakeSourceRefView | null;
  ownershipChain: readonly ['source-of-truth', 'projection', 'knowledge-lake'];
  authorityClass: 'projection';
  ledgerSoT: false;
  mutatesSource: false;
};

export type KnowledgeLakeConnectedReportView = {
  reportRunId: string;
  name: string;
  kind: string;
  status: string;
  createdAt: string;
  href: string;
  authorityClass: 'projection';
};

export type KnowledgeLakeConnectedNarrativeView = {
  reportRunId: string;
  availableOnReporting: true;
  href: string;
  authorsNarrative: false;
  authorityClass: 'narrative-reference';
};

export type KnowledgeLakeConnectedResearchView = {
  ownerType: string;
  id: string;
  producer: string;
  outcomeKind: string | null;
  href: string | null;
  authorityClass: 'projection';
};

export type KnowledgeLakeConnectedStrategyView = {
  libraryEntryId: string;
  strategyFamilyId: string | null;
  version: string | null;
  present: boolean;
  href: string;
  authorityClass: 'source_of_truth' | 'projection';
};

export type KnowledgeLakeConnectedMarketView = {
  kind: 'qualification' | 'market-profile' | 'market-state';
  ownerType: string;
  id: string;
  href: string | null;
  present: true;
  authorityClass: 'projection';
};

export type KnowledgeLakeDetailView = KnowledgeLakeListItemView & {
  payload: unknown;
  provenance: KnowledgeLakeProvenanceView;
  relationships: readonly KnowledgeLakeRelationshipView[];
  references: readonly KnowledgeLakeSourceRefView[];
  connectedReports: readonly KnowledgeLakeConnectedReportView[];
  connectedNarratives: readonly KnowledgeLakeConnectedNarrativeView[];
  connectedResearch: readonly KnowledgeLakeConnectedResearchView[];
  connectedStrategies: readonly KnowledgeLakeConnectedStrategyView[];
  connectedMarket: readonly KnowledgeLakeConnectedMarketView[];
  exportAvailable: true;
  exportKind: 'projection-json';
};

export type KnowledgeLakeHistoryItemView = KnowledgeLakeListItemView & {
  ingestedAt: string;
};

export type KnowledgeLakeHistoryPageView = {
  items: KnowledgeLakeHistoryItemView[];
  nextCursor: string | null;
  authorityClass: 'projection';
  ledgerSoT: false;
  analyticalCopy: true;
};

export type KnowledgeLakeListQuery = {
  q?: string;
  producer?: string;
  category?: string;
  mode?: string;
  libraryEntryId?: string;
  reportRunId?: string;
  tradingSessionId?: string;
  exchangeScopeId?: string;
  correlationId?: string;
  occurredFrom?: string;
  occurredTo?: string;
  limit?: number;
  cursor?: string;
};

export type AiAnalyticsKind = 'explain' | 'summarize' | 'trends' | 'narrative';

export type AiAnalyticsSourceRefView = {
  ownerType: string;
  id: string;
  href: string | null;
};

export type AiAnalyticsListItemView = {
  analysisId: string;
  narrativeId: string;
  workspaceId: string;
  kind: AiAnalyticsKind;
  reportRunId: string | null;
  createdAt: string;
  summary: string;
  authorityClass: 'narrative';
  sourceOfTruth: false;
  forcesTrade: false;
};

export type AiAnalyticsPageView = {
  items: AiAnalyticsListItemView[];
  nextCursor: string | null;
  authorityClass: 'narrative';
  sourceOfTruth: false;
  forcesTrade: false;
};

export type AiAnalyticsHistoryItemView = AiAnalyticsListItemView & {
  generatedAt: string;
};

export type AiAnalyticsHistoryPageView = {
  items: AiAnalyticsHistoryItemView[];
  nextCursor: string | null;
  authorityClass: 'narrative';
  sourceOfTruth: false;
  forcesTrade: false;
};

export type AiAnalyticsRecommendationView = {
  recommendationId: string;
  text: string;
  href: string | null;
  forcesTrade: false;
  ownsStrategy: false;
  ownsReport: false;
};

export type AiAnalyticsInsightView = {
  insightId: string;
  kind: string;
  text: string;
  forcesTrade: false;
};

export type AiAnalyticsReasoningView = {
  provider: string;
  modelId: string;
  templateVersion: string;
  method: string;
  ownsFacts: false;
  ownsReports: false;
};

export type AiAnalyticsProvenanceView = {
  analysisId: string;
  narrativeId: string;
  kind: AiAnalyticsKind;
  createdAt: string;
  modelMeta: Record<string, unknown> | null;
  sourceRefs: readonly AiAnalyticsSourceRefView[];
  ownershipChain: readonly ['source-of-truth', 'projection', 'narrative'];
  authorityClass: 'narrative';
  sourceOfTruth: false;
  mutatesSource: false;
  forcesTrade: false;
};

export type AiAnalyticsKnowledgeRefView = {
  entryId: string;
  href: string;
  present: boolean;
  authorityClass: 'projection';
};

export type AiAnalyticsReportRefView = {
  reportRunId: string;
  name: string;
  kind: string;
  status: string;
  href: string;
  ownsReport: false;
  authorityClass: 'projection';
};

export type AiAnalyticsStrategyRefView = {
  libraryEntryId: string;
  version: string | null;
  present: boolean;
  href: string;
  ownsStrategy: false;
  authorityClass: 'source_of_truth' | 'projection';
};

export type AiAnalyticsMarketRefView = {
  kind: 'qualification' | 'market-profile' | 'market-state' | 'deployment' | 'trading-session';
  ownerType: string;
  id: string;
  href: string | null;
  present: true;
};

export type AiAnalyticsComparisonSliceView = {
  metricKey: string;
  leftValue: unknown;
  rightValue: unknown;
  delta: unknown;
  authorityClass: 'projection';
  ownsReports: false;
};

export type AiAnalyticsComparisonView = {
  leftAnalysisId: string;
  rightAnalysisId: string;
  leftReportRunId: string;
  rightReportRunId: string;
  leftKind: AiAnalyticsKind;
  rightKind: AiAnalyticsKind;
  leftText: string;
  rightText: string;
  slices: readonly AiAnalyticsComparisonSliceView[];
  leftStrategy: AiAnalyticsStrategyRefView | null;
  rightStrategy: AiAnalyticsStrategyRefView | null;
  authorityClass: 'narrative';
  sourceOfTruth: false;
  forcesTrade: false;
};

export type AiAnalyticsDetailView = AiAnalyticsListItemView & {
  text: string;
  disclaimer: string;
  modesCovered: readonly string[];
  provenance: AiAnalyticsProvenanceView;
  reasoning: AiAnalyticsReasoningView;
  recommendations: readonly AiAnalyticsRecommendationView[];
  insights: readonly AiAnalyticsInsightView[];
  sources: readonly AiAnalyticsSourceRefView[];
  knowledgeRefs: readonly AiAnalyticsKnowledgeRefView[];
  reportRefs: readonly AiAnalyticsReportRefView[];
  strategyRefs: readonly AiAnalyticsStrategyRefView[];
  marketRefs: readonly AiAnalyticsMarketRefView[];
  comparison: AiAnalyticsComparisonView | null;
};

export type AiAnalyticsListQuery = {
  q?: string;
  kind?: AiAnalyticsKind;
  reportRunId?: string;
  libraryEntryId?: string;
  limit?: number;
};

export type GenerateAiAnalyticsRequest = {
  kind?: AiAnalyticsKind;
  reportRunId?: string;
  compareReportRunId?: string;
  libraryEntryId?: string;
  compareLibraryEntryId?: string;
  focus?: string;
};

export type NotificationChannelView = {
  channelId: string;
  status: 'active' | 'reserved-inactive';
  label: string;
  offered: boolean;
  authorityClass: 'notification-projection';
};

export type NotificationRoutedChannelView = {
  channelId: string;
  skipReason?: string;
};

export type NotificationTypeRoutingView = {
  type: string;
  enabled: boolean;
  channels: readonly string[];
  critical: boolean;
  currentRoutes: readonly NotificationRoutedChannelView[];
};

export type NotificationScheduleView = {
  dailyDeliveryTime: string;
  timezone: string;
  quietHours: { start: string; end: string } | null;
  criticalBypassQuietHours: boolean;
};

export type NotificationPreferencesView = {
  workspaceId: string;
  userId: string;
  enabled: boolean;
  channels: Readonly<Record<string, boolean>>;
  typeRouting: readonly NotificationTypeRoutingView[];
  schedule: NotificationScheduleView;
  updatedAt: string;
  authorityClass: 'notification-projection';
  generatesReports: false;
  controlPlane: false;
};

export type TelegramConnectionStatusView = {
  status: 'not-connected' | 'pending' | 'connected';
  connected: boolean;
  chatBound: boolean;
  connectedAt: string | null;
  updatedAt: string;
  connectAvailable: false;
  testAvailable: false;
  controlPlane: false;
  transport: 'in-memory';
};

export type TelegramConnectionProductView = {
  status: 'not-connected' | 'pending' | 'connected';
  connected: boolean;
  chatBound: boolean;
  pending: boolean;
  verified: boolean;
  connectedAt: string | null;
  updatedAt: string;
  deepLink: string | null;
  connectAvailable: boolean;
  completeAvailable: boolean;
  verifyAvailable: boolean;
  testAvailable: boolean;
  disconnectAvailable: boolean;
  controlPlane: false;
  transport: 'in-memory';
  botApiUsed: false;
  userEnteredBind: false;
  authorityClass: 'notification-projection';
};

export type TelegramConnectProductView = {
  connection: TelegramConnectionProductView;
  deepLink: string;
  controlPlane: false;
  botApiUsed: false;
  userEnteredBind: false;
  authorityClass: 'notification-projection';
};

export type PreferenceClockView = {
  timezone: string;
  dailyDeliveryTime: string;
  localTimeHHmm: string;
  quietHoursActive: boolean;
  dailyDeliveryReached: boolean;
  evaluatedAt: string;
  scheduler: false;
  clockKind: 'preference-clock';
};

export type NotificationRoutingView = {
  workspaceId: string;
  userId: string;
  masterEnabled: boolean;
  typeRouting: readonly NotificationTypeRoutingView[];
  channels: readonly NotificationChannelView[];
  telegram: TelegramConnectionStatusView;
  scheduleClock: PreferenceClockView;
  deferredChannelsActivated: false;
  controlPlane: false;
  authorityClass: 'notification-projection';
};

export type NotificationSettingsView = {
  preferences: NotificationPreferencesView;
  channels: readonly NotificationChannelView[];
  telegram: TelegramConnectionStatusView;
  routing: NotificationRoutingView;
  scheduleClock: PreferenceClockView;
  deferredChannelsActivated: false;
  generatesReports: false;
  controlPlane: false;
  authorityClass: 'notification-projection';
};

export type NotificationDeliveryListItemView = {
  deliveryId: string;
  workspaceId: string;
  userId: string;
  type: string;
  reportRunId: string | null;
  outcome: string;
  skipReasons: readonly string[];
  createdAt: string;
  authorityClass: 'notification-projection';
  generatesReports: false;
};

export type NotificationDeliveryPageView = {
  items: NotificationDeliveryListItemView[];
  authorityClass: 'notification-projection';
  generatesReports: false;
};

export type NotificationDeliveryAttemptView = {
  channelId: string;
  outcome: string;
  skipReason: string | null;
  detail: string | null;
};

export type NotificationDeliveryDetailView = NotificationDeliveryListItemView & {
  attempts: readonly NotificationDeliveryAttemptView[];
  channelDelivery: {
    outcome: string;
    telegramOutcome: string;
    telegramSkipReason?: string;
    telegramAdapterReached: boolean;
    botApiUsed: false;
    controlPlane: false;
    deferredChannelsActivated: false;
  };
  telegram: TelegramConnectionStatusView;
};

export type TelegramTestProductView = {
  connection: TelegramConnectionProductView;
  delivery: NotificationDeliveryDetailView;
  controlPlane: false;
  botApiUsed: false;
  authorityClass: 'notification-projection';
};

export type TelegramDiagnosticsView = {
  connection: TelegramConnectionProductView;
  verification: {
    status: 'not-connected' | 'pending' | 'connected';
    verified: boolean;
    chatBound: boolean;
    pending: boolean;
  };
  lastTelegramDelivery: {
    deliveryId: string;
    outcome: string;
    skipReason: string | null;
    adapterReached: boolean;
    createdAt: string;
  } | null;
  telegramTransport: 'in-memory';
  botApiUsed: false;
  controlPlane: false;
  deferredChannelsActivated: false;
  scheduler: false;
  retries: false;
  authorityClass: 'notification-projection';
};

export type NotificationChannelId = 'telegram' | 'email' | 'slack' | 'discord' | 'teams' | 'push';

export type NotificationChannelCardView = {
  channelId: NotificationChannelId;
  label: string;
  status: 'active' | 'reserved-inactive';
  offered: boolean;
  enabled: boolean;
  configurable: boolean;
  testAvailable: boolean;
  connectAvailable: boolean;
  configurationKind: 'telegram-connection' | 'reserved-inactive';
  transport: 'in-memory' | 'none';
  connectionStatus: 'not-connected' | 'pending' | 'connected' | 'reserved-inactive';
  liveTransportActivated: false;
  botApiUsed: false;
  authorityClass: 'notification-projection';
};

export type NotificationChannelConfigurationView = {
  kind: 'telegram-connection' | 'reserved-inactive';
  requiredFields: readonly string[];
  configurable: boolean;
  testAvailable: boolean;
  connectAvailable: boolean;
  liveTransportActivated: false;
  botApiUsed: false;
  userEnteredBind: false;
};

export type NotificationDeliveryTimingView = {
  producerTiming: 'immediate-on-deliver';
  dailyDeliveryTime: string;
  timezone: string;
  hourlyDigest: false;
  weeklyDigest: false;
  weekendSuppression: false;
  perTypeFrequency: false;
  perChannelQuietHours: false;
  scheduler: false;
  clockKind: 'preference-clock';
};

export type NotificationRoutingMatrixRowView = {
  type: string;
  enabled: boolean;
  critical: boolean;
  channels: Readonly<Record<string, boolean>>;
  currentSkipReasons: readonly string[];
};

export type NotificationRoutingMatrixView = {
  rows: NotificationRoutingMatrixRowView[];
  channelIds: readonly NotificationChannelId[];
  offeredChannelIds: readonly NotificationChannelId[];
  deferredChannelsActivated: false;
  controlPlane: false;
  authorityClass: 'notification-projection';
};

export type NotificationChannelsWorkspaceView = {
  channels: NotificationChannelCardView[];
  routingMatrix: NotificationRoutingMatrixView;
  timing: NotificationDeliveryTimingView;
  scheduleClock: PreferenceClockView;
  quietHours: { start: string; end: string } | null;
  criticalBypassQuietHours: boolean;
  masterEnabled: boolean;
  deferredChannelsActivated: false;
  generatesReports: false;
  controlPlane: false;
  authorityClass: 'notification-projection';
};

export type NotificationChannelDiagnosticsView = {
  channelId: NotificationChannelId;
  connectionState: 'not-connected' | 'pending' | 'connected' | 'reserved-inactive';
  enabled: boolean;
  offered: boolean;
  configurationHealth: 'ready' | 'not-connected' | 'pending' | 'disabled' | 'reserved-inactive';
  lastSuccessfulDeliveryId: string | null;
  lastFailureDeliveryId: string | null;
  lastSkipReason: string | null;
  lastDeliveryAt: string | null;
  latencyAvailable: false;
  testAvailable: boolean;
  liveTransportActivated: false;
  botApiUsed: false;
  scheduler: false;
  authorityClass: 'notification-projection';
};

export type NotificationChannelDetailView = NotificationChannelCardView & {
  configuration: NotificationChannelConfigurationView;
  routing: NotificationRoutingMatrixRowView[];
  diagnostics: NotificationChannelDiagnosticsView;
};

export type NotificationDeliveryListQuery = {
  userId?: string;
  reportRunId?: string;
  type?: string;
  outcome?: string;
  q?: string;
  limit?: number;
};

export type UpsertNotificationPreferencesRequest = {
  enabled?: boolean;
  channels?: Partial<Record<string, boolean>>;
  typeRouting?: Partial<
    Record<string, { enabled?: boolean; channels?: string[]; critical?: boolean }>
  >;
  schedule?: {
    dailyDeliveryTime?: string;
    timezone?: string;
    quietHours?: { start: string; end: string } | null;
    criticalBypassQuietHours?: boolean;
  };
};

export type LibraryListQuery = {
  strategyFamilyId?: string;
  statuses?: string;
  exchangeScopeId?: string;
  includeArchived?: boolean;
  limit?: number;
  q?: string;
};

export type PortfolioView = {
  id: string;
  ownerId: string;
  currency: string;
  status: string;
  balance: { cash: string };
  equity: { equity: string; realizedPnL: string; unrealizedPnL: string };
  margin: { usedMargin: string; availableMargin: string };
  portfolioValue: string;
  portfolioReturn: string;
  createdAt: string;
  updatedAt: string;
  refreshedAt: string;
};

export type PortfolioBalance = { cash: string };
export type PortfolioEquity = { equity: string; realizedPnL: string; unrealizedPnL: string };
export type PortfolioMargin = { usedMargin: string; availableMargin: string };

export type PositionView = {
  id: string;
  portfolioId: string;
  symbol: string;
  side: string;
  status: string;
  quantity: string;
  entryPrice: string;
  markPrice: string;
  averageEntryPrice: string;
  realizedPnL: string;
  unrealizedPnL: string;
  exposure: string;
  positionValue: string;
  returnPercent: string;
  createdAt: string;
  updatedAt: string;
  closedAt: string | null;
};

export type PositionHistoryEntry = {
  id: string;
  positionId: string;
  timestamp: string;
  action: string;
  quantity: string;
  price: string;
  realizedPnL: string;
};

export type OrderView = {
  id: string;
  portfolioId: string;
  positionId: string | null;
  symbol: string;
  side: string;
  type: string;
  quantity: string;
  requestedPrice: string | null;
  executedPrice: string | null;
  filledQuantity: string;
  remainingQuantity: string;
  status: string;
  timeInForce: string;
  createdAt: string;
  updatedAt: string;
  executedAt: string | null;
  cancelledAt: string | null;
};

export type OrderHistoryEntry = {
  id: string;
  orderId: string;
  timestamp: string;
  previousStatus: string;
  currentStatus: string;
  reason: string;
};

export type OrderFillEntry = {
  id: string;
  orderId: string;
  timestamp: string;
  quantity: string;
  price: string;
  fee: string;
};

export type RiskDecisionView = {
  id: string;
  portfolioId: string;
  orderId: string;
  decision: string;
  reason: string;
  score: string;
  timestamp: string;
};

export type RiskPolicyView = {
  id: string;
  portfolioId: string | null;
  name: string;
  enabled: boolean;
  priority: number;
  configuration: Record<string, unknown>;
};

export type RiskSummaryView = {
  exposure: string;
  marginUsage: string;
  availableMargin: string;
  usedMargin: string;
  openPositionCount: number;
  equity: string;
  cash: string;
};

export type PaperSessionView = {
  id: string;
  name: string;
  status: string;
  initialBalance: string;
  currentBalance: string;
  portfolioId: string;
  createdAt: string;
  startedAt: string | null;
  finishedAt: string | null;
};

export type PaperExecutionView = {
  id: string;
  sessionId: string;
  orderId: string;
  executionTime: string;
  executionPrice: string;
  slippage: string;
  commission: string;
};

export type PaperSessionStatistics = {
  netPnL: string;
  grossPnL: string;
  winRate: string;
  profitFactor: string;
  maxDrawdown: string;
  averageTrade: string;
  sharpeRatio: string;
  currentEquity: string;
  tradeCount: number;
  winningTrades: number;
  losingTrades: number;
};

export type ExchangeCapabilitiesView = {
  supportsSpot: boolean;
  supportsMargin: boolean;
  supportsFutures: boolean;
  supportsWebSocket: boolean;
  supportsMarketOrders: boolean;
  supportsLimitOrders: boolean;
  supportsOCO: boolean;
  supportsReduceOnly: boolean;
};

export type LiveSessionView = {
  id: string;
  exchange: string;
  accountId: string;
  status: string;
  startedAt: string | null;
  stoppedAt: string | null;
  lastHeartbeat: string | null;
  reconnectCount: number;
  synchronizationState: string;
  tradingFrozen: boolean;
  portfolioId: string;
  createdAt: string;
  updatedAt: string;
};

export type LiveStatusView = {
  activeSessions: LiveSessionView[];
  totalSessions: number;
  runningCount: number;
};

export type LiveAlertView = {
  type: string;
  severity: string;
  message: string;
  sessionId: string | null;
};

export type LiveHealthReportView = {
  sessionId: string | null;
  status: string | null;
  heartbeat: string | null;
  heartbeatLost: boolean;
  websocketLatencyMs: number | null;
  restLatencyMs: number | null;
  reconnectCount: number;
  synchronizationState: string | null;
  synchronizationDelayMs: number | null;
  orderAcknowledgementDelayMs: number | null;
  healthy: boolean;
  alerts: LiveAlertView[];
  sampledAt: string;
};

export type LiveWorkspaceHealthView = {
  sessions: LiveHealthReportView[];
  alerts: LiveAlertView[];
  healthy: boolean;
  sampledAt: string;
};

export type LiveSynchronizationLogView = {
  id: string;
  sessionId: string;
  kind: string;
  status: string;
  startedAt: string;
  completedAt: string | null;
  details: Record<string, unknown>;
};

export type LiveSynchronizationView = {
  logs: LiveSynchronizationLogView[];
  sessions: LiveSessionView[];
};

export type LiveEventView = {
  id: string;
  sessionId: string;
  type: string;
  timestamp: string;
  payload: Record<string, unknown>;
};

export type LiveOrderResult = {
  session: LiveSessionView;
  order: OrderView;
  exchangeOrderId: string | null;
};

export type ExchangeConnectionView = {
  id: string;
  exchangeId: string;
  status: string;
  latencyMs: number | null;
  lastHeartbeatAt: string | null;
  lastSynchronizedAt: string | null;
  apiPermissions: string[];
  supportedMarkets: string[];
  capabilities: ExchangeCapabilitiesView;
  createdAt: string;
  updatedAt: string;
};

export type ExchangeView = {
  exchangeId: string;
  capabilities: ExchangeCapabilitiesView;
  connection: ExchangeConnectionView | null;
};

export type ExchangeStatusView = {
  exchanges: ExchangeView[];
  connectedCount: number;
  totalCount: number;
};

/** Unversioned GET /health (RC-01 RuntimeHealthReport). */
export type RuntimeHealthView = {
  status: string;
  version: string;
  uptime: number;
  database: string;
  migrations: string;
  api: string;
  timestamp: string;
  environment: string;
  details: {
    api: string;
    database: string;
    migrations: string;
    version: string;
    controllersRegistered: number;
    pendingMigrations: readonly string[];
  };
};

/** Bot Facade projection over Trading Session (RC-19 / RC-20 / PC-13). */
export type SessionHealthView = {
  lifecycleStatus: string;
  leasePresent: boolean;
  failureReason: string | null;
};

export type SessionRuntimeStatusView = {
  workerState: string;
  acceptsTicks: boolean;
  fencingToken: number | null;
  evaluationEnabled: boolean;
};

export type TradingSessionBotView = {
  id: string;
  tradingSessionId: string;
  workspaceId: string;
  exchangeScopeId: string;
  paperAccountId: string;
  status: string;
  state: string;
  mission: { deploymentId: string };
  origin: string;
  version: number;
  failureReason: string | null;
  createdAt: string;
  recordedAt: string;
  actorId: string;
  correlationId: string | null;
  leaseOwnerId: string | null;
  fencingToken: number | null;
  health?: SessionHealthView;
  runtimeStatus?: SessionRuntimeStatusView;
  deploymentReference?: { deploymentId: string };
  sessionHandoff?: {
    sessionHandoffIntentId: string;
    orchestrationRunId: string | null;
    consumed: true;
    createsSession: false;
  } | null;
  latestReport?: {
    reportRunId: string;
    status: string;
    tradingSessionId: string | null;
    narrativeAttached: boolean;
    narrativeUnavailable: boolean;
  } | null;
  delivery?: {
    deliveryId: string;
    reportRunId: string | null;
    outcome: string;
    telegramAdapterReached: boolean;
    skipReasons: readonly string[];
  } | null;
};

export type PaperAccountView = {
  id: string;
  workspaceId: string;
  exchangeScopeId: string;
  currency: string;
  mode: 'paper';
  status: string;
  openingCapital: string;
  version: number;
  openedAt: string;
  recordedAt: string;
};

export type ExchangeScopeOverviewView = {
  id: string;
  exchangeCode: string;
  label: string;
  sessionCount: number;
  totalSessionCount: number;
};

export type ExchangeScopeProductFlags = {
  authorityClass: 'exchange_scope_artifact';
  isRuntime: false;
  isTradingSession: false;
  isRiskEngine: false;
  isExecutionEngine: false;
  isStrategyLibrary: false;
  approvesRisk: false;
  submitsOrders: false;
  liveVenueAdapter: false;
  venueApiUsed: false;
  liveCapital: false;
  mutable: false;
};

export type ExchangeVenueCatalogItemView = {
  venueCode: string;
  label: string;
  offered: true;
  liveAdapter: false;
  venueApiUsed: false;
};

export type ExchangeScopeListItemView = ExchangeScopeProductFlags & {
  exchangeScopeId: string;
  workspaceId: string;
  venueCode: string;
  displayName: string;
  lifecycleStatus: string;
  isActive: boolean;
  version: number;
  maxActiveSessions: number;
  modeContext: string;
  modeContextIsLabelOnly: boolean;
  blocksNewSessionCapacity: boolean;
};

export type ExchangeScopeWorkspaceView = ExchangeScopeProductFlags & {
  workspaceId: string;
  scopeCount: number;
  activeCount: number;
  suspendedCount: number;
  createdCount: number;
  archivedCount: number;
  currentActive: readonly ExchangeScopeListItemView[];
  scopes: readonly ExchangeScopeListItemView[];
  venues: readonly ExchangeVenueCatalogItemView[];
  inventsBalances: false;
  inventsFills: false;
  inventsRiskApprovals: false;
};

export type ExchangeScopeLifecycleActionView = {
  canActivate: boolean;
  canSuspend: boolean;
  canArchive: boolean;
  canRename: boolean;
  canUpdateConfig: boolean;
  canPublishPolicy: boolean;
  canBind: boolean;
};

export type ExchangeScopeConfigProductView = ExchangeScopeProductFlags & {
  exchangeScopeId: string;
  version: number;
  maxActiveSessions: number;
  symbolAllowlist: readonly string[];
  strategyAllowlist: readonly string[];
  modeContext: string;
  modeContextIsLabelOnly: boolean;
  updatedAt: string;
  updatedBy: string;
};

export type ExchangeScopeVersionView = ExchangeScopeProductFlags & {
  exchangeScopeId: string;
  version: number;
  displayName: string;
  lifecycleStatus: string;
  publishedAt: string;
  publishedBy: string;
  maxActiveSessions: number;
  modeContext: string;
  inputSummary: string;
};

export type ExchangeRiskPolicyProductView = {
  exchangeRiskPolicyId: string;
  exchangeScopeId: string;
  workspaceId: string;
  policyVersion: number;
  maxExposureLabel: string;
  maxOrderNotionalLabel: string;
  notes: string;
  publishedAt: string;
  publishedBy: string;
  authorityClass: 'exchange_policy_input';
  isRiskDecision: false;
  approvesRisk: false;
  isRiskEngine: false;
  liveVenueAdapter: false;
  venueApiUsed: false;
  mutable: false;
};

export type TradingAccountBindingProductView = ExchangeScopeProductFlags & {
  tradingAccountBindingId: string;
  exchangeScopeId: string;
  workspaceId: string;
  tradingAccountId: string;
  status: string;
  boundAt: string;
  boundBy: string;
  ownsLedger: false;
  movesBalances: false;
};

export type AdapterBindingContextProductView = ExchangeScopeProductFlags & {
  adapterBindingContextId: string;
  exchangeScopeId: string;
  workspaceId: string;
  adapterIdentity: string;
  modeContext: string;
  status: string;
  updatedAt: string;
  updatedBy: string;
  isExecutionEngine: false;
  definesWireProtocol: false;
};

export type ExchangeScopeLifecycleProductView = ExchangeScopeProductFlags & {
  exchangeScopeId: string;
  workspaceId: string;
  status: string;
  isActive: boolean;
  updatedAt: string;
  updatedBy: string;
  reason: string;
  blocksNewSessionCapacity: boolean;
  authorizesRuntime: false;
  executesActions: false;
  actions: ExchangeScopeLifecycleActionView;
};

export type ExchangeScopeMetadataProductView = ExchangeScopeProductFlags & {
  exchangeScopeId: string;
  workspaceId: string;
  asOf: string;
  inputSummary: string;
  adapterContextRef: string | null;
  policyRef: string | null;
  ownsStrategyLibrary: false;
  ownsRuntimeEnforcement: false;
  ownsTradingSession: false;
  ownsRiskDecisions: false;
  ownsOrders: false;
  ownsExecution: false;
  ownsAccounting: false;
};

export type ExchangeScopeHistoryItemView = ExchangeScopeProductFlags & {
  kind: 'version' | 'lifecycle' | 'policy' | 'binding';
  at: string;
  by: string;
  summary: string;
  version?: number;
  lifecycleStatus?: string;
  policyVersion?: number;
  bindingStatus?: string;
};

export type ExchangeScopeDetailView = ExchangeScopeProductFlags & {
  exchangeScopeId: string;
  workspaceId: string;
  venueCode: string;
  displayName: string;
  lifecycle: ExchangeScopeLifecycleProductView;
  current: ExchangeScopeListItemView;
  config: ExchangeScopeConfigProductView | null;
  versions: readonly ExchangeScopeVersionView[];
  policies: readonly ExchangeRiskPolicyProductView[];
  currentPolicy: ExchangeRiskPolicyProductView | null;
  bindings: readonly TradingAccountBindingProductView[];
  adapterContext: AdapterBindingContextProductView | null;
  metadata: ExchangeScopeMetadataProductView | null;
  history: readonly ExchangeScopeHistoryItemView[];
  activeStatus: {
    isActive: boolean;
    lifecycleStatus: string;
    blocksNewSessionCapacity: boolean;
  };
};

export type ExchangeScopeCommandView = ExchangeScopeProductFlags & {
  outcome: string;
  exchangeScopeId: string;
  exchangeRiskPolicyId?: string;
  tradingAccountBindingId?: string;
  adapterBindingContextId?: string;
  rejectionReasons: readonly string[];
  scope: ExchangeScopeDetailView | null;
};

export type ExchangeScopePageView = ExchangeScopeProductFlags & {
  items: readonly ExchangeScopeListItemView[];
};

export type RegisterExchangeScopeRequest = {
  venueCode: string;
  displayName: string;
  notes?: string;
  maxActiveSessions?: number;
  modeContext?: 'lab' | 'paper' | 'live';
};

export type UpdateExchangeScopeConfigRequest = {
  displayName?: string;
  maxActiveSessions?: number;
  symbolAllowlist?: string[];
  strategyAllowlist?: string[];
  modeContext?: 'lab' | 'paper' | 'live';
};

export type QualificationProductFlags = {
  authorityClass: 'research_artifact';
  forcesTrade: false;
  authorizesSession: false;
  isMarketProfile: false;
  isMarketState: false;
  isRiskEngine: false;
  isExecutionEngine: false;
  isTradingSession: false;
  scoresMarket: false;
  calculatesConfidence: false;
};

export type QualificationLifecycleActionView = {
  canRequest: boolean;
  canConfirm: boolean;
  canCancel: boolean;
  canComplete: boolean;
  canFail: boolean;
  canRequalify: boolean;
};

export type QualificationTargetListItemView = QualificationProductFlags & {
  targetId: string;
  workspaceId: string;
  exchangeScopeId: string;
  marketSymbol: string;
  displayName: string;
  lifecycleState: string;
  latestRunStatus: string | null;
  confidenceLevel: string | null;
  healthStatus: string | null;
  runCount: number;
  updatedAt: string;
};

export type QualificationRunListItemView = QualificationProductFlags & {
  qualificationRunId: string;
  workspaceId: string;
  targetId: string;
  exchangeScopeId: string | null;
  marketSymbol: string | null;
  status: string;
  modeContext: string;
  createdAt: string;
  completedAt: string | null;
};

export type QualificationWorkspaceView = QualificationProductFlags & {
  workspaceId: string;
  targetCount: number;
  qualifiedCount: number;
  qualifyingCount: number;
  pendingConfirmCount: number;
  failedCount: number;
  runCount: number;
  targets: readonly QualificationTargetListItemView[];
  recentRuns: readonly QualificationRunListItemView[];
};

export type QualificationLifecycleProductView = QualificationProductFlags & {
  targetId: string;
  workspaceId: string;
  state: string;
  activeRunId: string | null;
  latestCompletedRunId: string | null;
  latestProfileId: string | null;
  updatedAt: string;
  actions: QualificationLifecycleActionView;
};

export type QualificationConfidenceProductView = QualificationProductFlags & {
  targetId: string;
  workspaceId: string;
  level: string;
  score: number | null;
  rationaleSummary: string;
  sourceRunId: string;
  asOf: string;
  staleLabel: string;
};

export type QualificationHealthProductView = QualificationProductFlags & {
  targetId: string;
  workspaceId: string;
  status: string;
  indicators: readonly { key: string; value: string; note: string | null }[];
  sourceRunId: string;
  asOf: string;
};

export type QualificationHistoryItemView = QualificationProductFlags & {
  kind: 'run' | 'lifecycle' | 'confidence' | 'health';
  at: string;
  summary: string;
  status?: string;
  qualificationRunId?: string;
};

export type QualificationRunDetailView = QualificationProductFlags & {
  qualificationRunId: string;
  workspaceId: string;
  targetId: string;
  exchangeScopeId: string | null;
  marketSymbol: string | null;
  displayName: string | null;
  status: string;
  modeContext: string;
  requestedBy: string;
  confirmedBy: string | null;
  createdAt: string;
  completedAt: string | null;
  rejectionReasons: readonly string[];
  inputSummary: {
    observationCount: number;
    researchRefCount: number;
    liveMarketDataRefs: readonly string[];
    researchOutputRefs: readonly string[];
  };
  lifecycle: QualificationLifecycleProductView | null;
  confidence: QualificationConfidenceProductView | null;
  health: QualificationHealthProductView | null;
  actions: QualificationLifecycleActionView;
};

export type QualificationTargetDetailView = QualificationProductFlags & {
  targetId: string;
  workspaceId: string;
  exchangeScopeId: string;
  marketSymbol: string;
  displayName: string;
  current: QualificationTargetListItemView;
  lifecycle: QualificationLifecycleProductView;
  confidence: QualificationConfidenceProductView | null;
  health: QualificationHealthProductView | null;
  runs: readonly QualificationRunListItemView[];
  history: readonly QualificationHistoryItemView[];
  latestRun: QualificationRunDetailView | null;
};

export type QualificationCommandView = QualificationProductFlags & {
  outcome: string;
  qualificationRunId: string;
  rejectionReasons: readonly string[];
  publishedProfileId: string | null;
  target: QualificationTargetDetailView | null;
  run: QualificationRunDetailView | null;
};

export type QualificationTargetPageView = QualificationProductFlags & {
  items: readonly QualificationTargetListItemView[];
};

export type QualificationRunPageView = QualificationProductFlags & {
  items: readonly QualificationRunListItemView[];
};

export type RequestQualificationRunRequest = {
  exchangeScopeId: string;
  marketSymbol: string;
  modeContext: 'lab' | 'paper';
  notes?: string;
};

export type MarketProfileProductFlags = {
  authorityClass: 'research_artifact';
  forcesTrade: false;
  authorizesSession: false;
  isMarketQualification: false;
  isMarketState: false;
  isRiskEngine: false;
  isExecutionEngine: false;
  isTradingSession: false;
  calculatesProfile: false;
  scoresMarket: false;
};

export type MarketProfileListItemView = MarketProfileProductFlags & {
  marketProfileId: string;
  workspaceId: string;
  targetId: string;
  exchangeScopeId: string;
  marketSymbol: string;
  displayName: string;
  version: number;
  versionCount: number;
  qualificationRunId: string;
  publishedAt: string;
  publishedBy: string | null;
  confidenceLevel: string | null;
  isLatest: boolean;
};

export type MarketProfileVersionListItemView = MarketProfileProductFlags & {
  marketProfileId: string;
  workspaceId: string;
  targetId: string;
  exchangeScopeId: string;
  marketSymbol: string;
  version: number;
  qualificationRunId: string;
  publishedAt: string;
  publishedBy: string | null;
  confidenceLevel: string | null;
  isLatest: boolean;
};

export type MarketProfileWorkspaceView = MarketProfileProductFlags & {
  workspaceId: string;
  targetCount: number;
  versionCount: number;
  latestCount: number;
  latest: readonly MarketProfileListItemView[];
  recentVersions: readonly MarketProfileVersionListItemView[];
};

export type MarketProfilePageView = MarketProfileProductFlags & {
  items: readonly MarketProfileListItemView[];
};

export type MarketProfileVersionPageView = MarketProfileProductFlags & {
  items: readonly MarketProfileVersionListItemView[];
};

export type MarketProfileMetadataView = MarketProfileProductFlags & {
  marketProfileId: string;
  workspaceId: string;
  targetId: string;
  exchangeScopeId: string;
  marketSymbol: string;
  version: number;
  publishedAt: string;
  publishedBy: string;
  qualificationRunId: string;
  confidenceLevel: string;
  confidenceScore: number | null;
  confidenceSourceRunId: string;
  rationaleSummary: string;
};

export type MarketProfilePublishedSourceView = MarketProfileProductFlags & {
  qualificationRunId: string;
  sourceRunId: string;
  publishedAt: string;
  publishedBy: string;
  targetId: string;
  exchangeScopeId: string;
  marketSymbol: string;
};

export type MarketProfileDimensionMetricView = {
  key: string;
  value: string;
};

export type MarketProfileDimensionView = {
  kind: 'volatility' | 'liquidity' | 'trend' | 'structure';
  regimeLabel: string | null;
  windowSummary: string | null;
  notes: string | null;
  metrics: readonly MarketProfileDimensionMetricView[];
};

export type MarketProfileDimensionsView = MarketProfileProductFlags & {
  marketProfileId: string;
  version: number;
  volatility: MarketProfileDimensionView;
  liquidity: MarketProfileDimensionView;
  trend: MarketProfileDimensionView;
  structure: MarketProfileDimensionView;
};

export type MarketProfileCompareFieldView = {
  field: string;
  from: string;
  to: string;
  changed: boolean;
};

export type MarketProfileCompareView = MarketProfileProductFlags & {
  targetId: string;
  workspaceId: string;
  exchangeScopeId: string;
  marketSymbol: string;
  fromVersion: number;
  toVersion: number;
  from: MarketProfileMetadataView;
  to: MarketProfileMetadataView;
  differences: readonly MarketProfileCompareFieldView[];
};

export type MarketProfileDetailView = MarketProfileProductFlags & {
  marketProfileId: string;
  workspaceId: string;
  targetId: string;
  exchangeScopeId: string;
  marketSymbol: string;
  displayName: string;
  version: number;
  isLatest: boolean;
  isCurrentPublished: boolean;
  currentPublishedVersion: number;
  metadata: MarketProfileMetadataView;
  publishedSource: MarketProfilePublishedSourceView;
  dimensions: MarketProfileDimensionsView;
  versions: readonly MarketProfileVersionListItemView[];
};

export type MarketProfileTargetDetailView = MarketProfileProductFlags & {
  targetId: string;
  workspaceId: string;
  exchangeScopeId: string;
  marketSymbol: string;
  displayName: string;
  currentPublishedVersion: number;
  latest: MarketProfileDetailView;
  versions: readonly MarketProfileVersionListItemView[];
};

export type MarketStateProductFlags = {
  authorityClass: 'market_state_artifact';
  forcesTrade: false;
  isQualification: false;
  isProfile: false;
  authorizesRuntime: false;
  classifiesMarket: false;
  selectsStrategy: false;
  orchestrates: false;
};

export type MarketStateListItemView = MarketStateProductFlags & {
  marketStateId: string;
  workspaceId: string;
  targetId: string;
  exchangeScopeId: string;
  marketSymbol: string;
  displayName: string;
  version: number;
  versionCount: number;
  lifecycleStatus: string;
  regimeLabel: string;
  publishedAt: string;
  publishedBy: string;
  isCurrent: boolean;
  isStale: boolean;
};

export type MarketStateVersionListItemView = MarketStateProductFlags & {
  marketStateId: string;
  workspaceId: string;
  targetId: string;
  exchangeScopeId: string;
  marketSymbol: string;
  version: number;
  lifecycleStatus: string;
  regimeLabel: string;
  publishedAt: string;
  publishedBy: string;
  isCurrent: boolean;
};

export type MarketStateWorkspaceView = MarketStateProductFlags & {
  workspaceId: string;
  targetCount: number;
  versionCount: number;
  currentCount: number;
  current: readonly MarketStateListItemView[];
  recentVersions: readonly MarketStateVersionListItemView[];
};

export type MarketStatePageView = MarketStateProductFlags & {
  items: readonly MarketStateListItemView[];
};

export type MarketStateVersionPageView = MarketStateProductFlags & {
  items: readonly MarketStateVersionListItemView[];
};

export type MarketStateLifecycleView = MarketStateProductFlags & {
  marketStateId: string;
  targetId: string;
  status: string;
  updatedAt: string;
  updatedBy: string;
  reason: string;
  isStale: boolean;
};

export type MarketStateMetadataView = MarketStateProductFlags & {
  marketStateId: string;
  workspaceId: string;
  targetId: string;
  exchangeScopeId: string;
  marketSymbol: string;
  version: number;
  observationAsOf: string;
  confidenceRef: string | null;
  profileRef: string | null;
  inputSummary: string;
  notes: string | null;
  publishedAt: string;
  publishedBy: string;
};

export type MarketStateSnapshotView = {
  regimeLabel: string;
  volatilityLabel: string | null;
  liquidityLabel: string | null;
  narrativeSummary: string;
};

export type MarketStateTransitionView = MarketStateProductFlags & {
  marketStateId: string;
  workspaceId: string;
  targetId: string;
  exchangeScopeId: string;
  marketSymbol: string;
  fromVersion: number | null;
  toVersion: number;
  fromLifecycle: string | null;
  toLifecycle: string;
  transitionedAt: string;
};

export type MarketStateTransitionPageView = MarketStateProductFlags & {
  items: readonly MarketStateTransitionView[];
};

export type MarketStateQualificationReferenceView = MarketStateProductFlags & {
  present: boolean;
  qualificationTargetId: string | null;
  lifecycleState: string | null;
  confidenceLevel: string | null;
  healthStatus: string | null;
  latestRunStatus: string | null;
  sourceRunId: string | null;
  asOf: string | null;
};

export type MarketStateProfileReferenceView = MarketStateProductFlags & {
  present: boolean;
  marketProfileId: string | null;
  profileTargetId: string | null;
  version: number | null;
  qualificationRunId: string | null;
  confidenceLevel: string | null;
  publishedAt: string | null;
};

export type MarketStateDetailView = MarketStateProductFlags & {
  marketStateId: string;
  workspaceId: string;
  targetId: string;
  exchangeScopeId: string;
  marketSymbol: string;
  displayName: string;
  version: number;
  isCurrent: boolean;
  currentVersion: number;
  lifecycle: MarketStateLifecycleView;
  snapshot: MarketStateSnapshotView;
  metadata: MarketStateMetadataView;
  qualification: MarketStateQualificationReferenceView;
  profile: MarketStateProfileReferenceView;
  versions: readonly MarketStateVersionListItemView[];
  transitions: readonly MarketStateTransitionView[];
};

export type MarketStateTargetDetailView = MarketStateProductFlags & {
  targetId: string;
  workspaceId: string;
  exchangeScopeId: string;
  marketSymbol: string;
  displayName: string;
  currentVersion: number;
  current: MarketStateDetailView;
  versions: readonly MarketStateVersionListItemView[];
  transitions: readonly MarketStateTransitionView[];
};

export type MarketStateRefreshView = MarketStateProductFlags & {
  outcome: 'accepted';
  marketStateId: string;
  version: number;
  current: MarketStateDetailView;
};

async function requestAbsolute<T>(url: string, init?: RequestInit): Promise<T> {
  return sessionRequest<T>(url, init);
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  return sessionRequest<T>(`${apiUrl}${API_PREFIX}${path}`, init, path);
}

async function requestText(path: string, init?: RequestInit): Promise<string> {
  return sessionRequest<string>(`${apiUrl}${API_PREFIX}${path}`, init, path, 'text');
}

const AUTH_BOOTSTRAP_PATHS = [
  '/auth/login',
  '/auth/register',
  '/auth/refresh',
  '/auth/logout',
  '/auth/csrf',
  '/auth/recovery',
  '/auth/forgot-password',
  '/auth/reset-password',
];

let refreshInFlight: Promise<boolean> | null = null;

function isAuthBootstrapPath(path?: string): boolean {
  if (!path) return false;
  return AUTH_BOOTSTRAP_PATHS.some(
    (candidate) => path === candidate || path.startsWith(`${candidate}?`),
  );
}

function applySessionHeaders(headers: Headers, method: string, path?: string) {
  if (!headers.has('Content-Type') && method !== 'GET' && method !== 'HEAD') {
    headers.set('Content-Type', 'application/json');
  }

  const token = getAccessToken();
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const csrf = getCsrfToken();
  const mutating = method !== 'GET' && method !== 'HEAD';
  if (
    csrf &&
    mutating &&
    (path === '/auth/refresh' || path === '/auth/logout' || !isAuthBootstrapPath(path))
  ) {
    headers.set('X-CSRF-Token', csrf);
  }

  const workspace = getActiveWorkspace();
  if (workspace && !headers.has('X-Workspace-Id')) {
    headers.set('X-Workspace-Id', workspace.id);
  }
}

async function ensureCsrfToken(): Promise<string | null> {
  const existing = getCsrfToken();
  if (existing) return existing;
  try {
    const res = await fetch(`${apiUrl}${API_PREFIX}/auth/csrf`, {
      method: 'GET',
      credentials: 'include',
    });
    if (!res.ok) return null;
    const body = (await res.json()) as { csrfToken?: string };
    if (!body.csrfToken) return null;
    setCsrfToken(body.csrfToken);
    return body.csrfToken;
  } catch {
    return null;
  }
}

async function tryRefreshSession(): Promise<boolean> {
  if (refreshInFlight) return refreshInFlight;
  refreshInFlight = (async () => {
    try {
      await ensureCsrfToken();
      const headers = new Headers({ 'Content-Type': 'application/json' });
      const csrf = getCsrfToken();
      if (csrf) headers.set('X-CSRF-Token', csrf);
      const res = await fetch(`${apiUrl}${API_PREFIX}/auth/refresh`, {
        method: 'POST',
        credentials: 'include',
        headers,
        body: '{}',
      });
      if (!res.ok) return false;
      const body = (await res.json()) as LoginResponse;
      if (!body.accessToken) return false;
      setAccessToken(body.accessToken, body.csrfToken);
      return true;
    } catch {
      return false;
    }
  })();
  try {
    return await refreshInFlight;
  } finally {
    refreshInFlight = null;
  }
}

async function sessionRequest<T>(
  url: string,
  init?: RequestInit,
  path?: string,
  mode: 'json' | 'text' = 'json',
): Promise<T> {
  const method = (init?.method ?? 'GET').toUpperCase();
  if (method !== 'GET' && method !== 'HEAD' && !isAuthBootstrapPath(path)) {
    await ensureCsrfToken();
  }
  const headers = new Headers(init?.headers);
  applySessionHeaders(headers, method, path);

  let res: Response;
  try {
    res = await fetch(url, {
      ...init,
      method,
      headers,
      credentials: 'include',
    });
  } catch {
    throw new Error(`Cannot reach API at ${apiUrl}. Start it with: pnpm --filter api start`);
  }

  if (res.status === 401 && !isAuthBootstrapPath(path)) {
    const refreshed = await tryRefreshSession();
    if (refreshed) {
      const retryHeaders = new Headers(init?.headers);
      applySessionHeaders(retryHeaders, method, path);
      res = await fetch(url, {
        ...init,
        method,
        headers: retryHeaders,
        credentials: 'include',
      });
    }
  }

  if (res.status === 401) {
    if (!isAuthBootstrapPath(path)) {
      clearAccessToken();
      if (typeof window !== 'undefined' && !window.location.pathname.startsWith('/login')) {
        window.location.assign('/login');
      }
    }
  }

  if (!res.ok) {
    const text = await res.text();
    throw new Error(mapHttpError(res.status, text));
  }

  if (mode === 'text') {
    return (await res.text()) as T;
  }

  return res.json() as Promise<T>;
}

export function runCampaign(body: CampaignRunRequest) {
  return request<CampaignSummary>('/campaigns/run', {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

export function analyzeCampaign(campaignSummary: CampaignSummary) {
  return request<ResearchAnalysis>('/campaigns/analyze', {
    method: 'POST',
    body: JSON.stringify({ campaignSummary }),
  });
}

export function runMultiDatasetCampaign(body: MultiDatasetCampaignRequest) {
  return request<MultiDatasetCampaignSummary>('/campaigns/run-multi', {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

export function runWalkForwardCampaign(body: WalkForwardCampaignRequest) {
  return request<WalkForwardCampaignSummary>('/campaigns/run-walk-forward', {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

export function listCampaignHistory() {
  return request<CampaignHistoryPageView>('/campaign-history?pageSize=50&sortDirection=DESC');
}

export function exportCampaignHistory(sessionId: string, format: 'json' | 'csv') {
  return requestText(`/campaign-history/${sessionId}/export?format=${format}`);
}

export function campaignSummaryFromSession(session: CampaignHistorySessionView): CampaignSummary {
  return {
    campaignId: session.report.campaignId,
    strategyId: session.report.strategyId,
    datasetId: session.report.datasetId,
    totalRuns: session.report.totalRuns,
    passCount: session.report.passCount,
    failCount: session.report.failCount,
    needsReviewCount: session.report.needsReviewCount,
    bestExperimentId: session.report.bestExperimentId,
    createdAt: session.report.createdAt,
    failedRuns: [],
  };
}

function knowledgeLakeQueryString(query: KnowledgeLakeListQuery): string {
  const params = new URLSearchParams();
  if (query.q?.trim()) params.set('q', query.q.trim());
  if (query.producer) params.set('producer', query.producer);
  if (query.category) params.set('category', query.category);
  if (query.mode) params.set('mode', query.mode);
  if (query.libraryEntryId) params.set('libraryEntryId', query.libraryEntryId);
  if (query.reportRunId) params.set('reportRunId', query.reportRunId);
  if (query.tradingSessionId) params.set('tradingSessionId', query.tradingSessionId);
  if (query.exchangeScopeId) params.set('exchangeScopeId', query.exchangeScopeId);
  if (query.correlationId) params.set('correlationId', query.correlationId);
  if (query.occurredFrom) params.set('occurredFrom', query.occurredFrom);
  if (query.occurredTo) params.set('occurredTo', query.occurredTo);
  if (query.limit) params.set('limit', String(query.limit));
  if (query.cursor) params.set('cursor', query.cursor);
  return params.toString();
}

function aiAnalyticsQueryString(query: AiAnalyticsListQuery): string {
  const params = new URLSearchParams();
  if (query.q?.trim()) params.set('q', query.q.trim());
  if (query.kind) params.set('kind', query.kind);
  if (query.reportRunId) params.set('reportRunId', query.reportRunId);
  if (query.libraryEntryId) params.set('libraryEntryId', query.libraryEntryId);
  if (query.limit) params.set('limit', String(query.limit));
  return params.toString();
}

export const api = {
  login: (email: string, password: string) =>
    request<LoginResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }),
  register: (email: string, displayName: string, password: string) =>
    request<LoginResponse>('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email, displayName, password }),
    }),
  refresh: () =>
    request<LoginResponse>('/auth/refresh', {
      method: 'POST',
      body: '{}',
    }),
  logout: () =>
    request<{ ok: true }>('/auth/logout', {
      method: 'POST',
      body: '{}',
    }),
  me: () => request<AuthUser>('/auth/me'),
  listPeople: () => request<{ operators: PeopleOperatorView[] }>('/people'),
  assignPersonRole: (userId: string, role: string) =>
    request<PeopleOperatorView>(`/people/${encodeURIComponent(userId)}/role`, {
      method: 'PATCH',
      body: JSON.stringify({ role }),
    }),
  listSignInSessions: () => request<{ sessions: SignInSessionView[] }>('/auth/sessions'),
  revokeSignInSession: (sessionId: string) =>
    request<{ endedCurrent: boolean }>(`/auth/sessions/${encodeURIComponent(sessionId)}`, {
      method: 'DELETE',
      body: '{}',
    }),
  revokeOtherSignInSessions: () =>
    request<{ revokedCount: number }>('/auth/sessions/revoke-others', {
      method: 'POST',
      body: '{}',
    }),
  revokeAllSignInSessions: () =>
    request<{ endedCurrent: true }>('/auth/sessions/revoke-all', {
      method: 'POST',
      body: '{}',
    }),
  recoveryStatus: () => request<{ available: boolean; message: string }>('/auth/recovery'),
  forgotPassword: (email: string) =>
    request<{ outcome: 'accepted' | 'unavailable'; message: string }>('/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email }),
    }),
  resetPassword: (token: string, password: string) =>
    request<{ ok: true }>('/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify({ token, password }),
    }),
  changePassword: (currentPassword: string, newPassword: string) =>
    request<{ ok: true }>('/auth/change-password', {
      method: 'POST',
      body: JSON.stringify({ currentPassword, newPassword }),
    }),
  bootstrapWorkspace: () =>
    request<WorkspaceView>('/workspaces/bootstrap', {
      method: 'POST',
      body: '{}',
    }),
  listWorkspaces: () => request<WorkspaceView[]>('/workspaces'),
  createWorkspace: (name: string) =>
    request<WorkspaceView>('/workspaces', {
      method: 'POST',
      body: JSON.stringify({ name }),
    }),
  getWorkspace: (id: string) => request<WorkspaceView>(`/workspaces/${id}`),
  renameWorkspace: (id: string, name: string) =>
    request<WorkspaceView>(`/workspaces/${id}`, {
      method: 'PATCH',
      body: JSON.stringify({ name }),
    }),
  archiveWorkspace: (id: string) =>
    request<WorkspaceView>(`/workspaces/${id}/archive`, {
      method: 'POST',
      body: '{}',
    }),
  getConnectionCatalog: () => request<ConnectionCatalogView>('/connections/catalog'),
  getMarketDataProviders: () => request<MarketDataProviderCatalogView>('/market-data/providers'),
  getMarketDataSymbols: (connectionId: string) =>
    request<MarketSymbolDiscoveryView>(
      `/market-data/connections/${encodeURIComponent(connectionId)}/symbols`,
    ),
  discoverMarketDataSymbols: (connectionId: string) =>
    request<MarketSymbolDiscoveryView>(
      `/market-data/connections/${encodeURIComponent(connectionId)}/symbols/discover`,
      {
        method: 'POST',
        body: '{}',
      },
    ),
  getMarketDataTicker: (connectionId: string, exchangeSymbol: string) =>
    request<MarketTickerRetrievalView>(
      `/market-data/connections/${encodeURIComponent(connectionId)}/ticker?exchangeSymbol=${encodeURIComponent(exchangeSymbol)}`,
    ),
  retrieveMarketDataTicker: (
    connectionId: string,
    body: { exchangeSymbol: string; normalizedSymbol: string },
  ) =>
    request<MarketTickerRetrievalView>(
      `/market-data/connections/${encodeURIComponent(connectionId)}/ticker/retrieve`,
      {
        method: 'POST',
        body: JSON.stringify(body),
      },
    ),
  retrieveMarketDataCandles: (
    connectionId: string,
    body: {
      exchangeSymbol: string;
      normalizedSymbol: string;
      interval: MarketCandleInterval;
      rangeStart: string;
      rangeEnd: string;
    },
  ) =>
    request<MarketCandleRetrievalView>(
      `/market-data/connections/${encodeURIComponent(connectionId)}/candles/retrieve`,
      {
        method: 'POST',
        body: JSON.stringify(body),
      },
    ),
  retrieveMarketDataOrderBook: (
    connectionId: string,
    body: {
      exchangeSymbol: string;
      normalizedSymbol: string;
      depthLimit: MarketOrderBookDepth;
    },
  ) =>
    request<MarketOrderBookRetrievalView>(
      `/market-data/connections/${encodeURIComponent(connectionId)}/order-book/retrieve`,
      {
        method: 'POST',
        body: JSON.stringify(body),
      },
    ),
  listConnections: () => request<ConnectionMetadataView[]>('/connections'),
  getConnection: (id: string) =>
    request<ConnectionMetadataView>(`/connections/${encodeURIComponent(id)}`),
  createConnection: (body: { displayName: string; provider: ConnectionProvider }) =>
    request<ConnectionMetadataView>('/connections', {
      method: 'POST',
      body: JSON.stringify(body),
    }),
  renameConnection: (id: string, displayName: string) =>
    request<ConnectionMetadataView>(`/connections/${encodeURIComponent(id)}`, {
      method: 'PATCH',
      body: JSON.stringify({ displayName }),
    }),
  storeConnectionCredentials: (id: string, credentials: Record<string, string>) =>
    request<ConnectionMetadataView>(`/connections/${encodeURIComponent(id)}/credentials`, {
      method: 'POST',
      body: JSON.stringify({ credentials }),
    }),
  replaceConnectionCredentials: (id: string, credentials: Record<string, string>) =>
    request<ConnectionMetadataView>(`/connections/${encodeURIComponent(id)}/credentials`, {
      method: 'PUT',
      body: JSON.stringify({ credentials }),
    }),
  validateConnection: (id: string) =>
    request<ConnectionMetadataView>(`/connections/${encodeURIComponent(id)}/validate`, {
      method: 'POST',
      body: '{}',
    }),
  disconnectConnection: (id: string) =>
    request<ConnectionMetadataView>(`/connections/${encodeURIComponent(id)}/disconnect`, {
      method: 'POST',
      body: '{}',
    }),
  disableConnection: (id: string) =>
    request<ConnectionMetadataView>(`/connections/${encodeURIComponent(id)}/disable`, {
      method: 'POST',
      body: '{}',
    }),
  revokeConnection: (id: string) =>
    request<ConnectionMetadataView>(`/connections/${encodeURIComponent(id)}/revoke`, {
      method: 'POST',
      body: '{}',
    }),
  listStrategyLibrary: (query: LibraryListQuery = {}) => {
    const params = new URLSearchParams();
    if (query.strategyFamilyId) params.set('strategyFamilyId', query.strategyFamilyId);
    if (query.statuses) params.set('statuses', query.statuses);
    if (query.exchangeScopeId) params.set('exchangeScopeId', query.exchangeScopeId);
    if (query.includeArchived) params.set('includeArchived', 'true');
    if (query.limit) params.set('limit', String(query.limit));
    if (query.q?.trim()) params.set('q', query.q.trim());
    const qs = params.toString();
    return request<StrategyLibraryPageView>(`/strategy-library${qs ? `?${qs}` : ''}`);
  },
  getStrategyLibraryEntry: (libraryEntryId: string) =>
    request<StrategyLibraryRecordView>(`/strategy-library/${libraryEntryId}`),
  checkStrategyLibraryEligibility: (libraryEntryId: string) =>
    request<StrategyLibraryEligibilityView>(`/strategy-library/${libraryEntryId}/eligibility`),
  certifyStrategy: (body: CertifyStrategyRequest) =>
    request<CertificationAttemptView>('/strategy-library/certifications', {
      method: 'POST',
      body: JSON.stringify(body),
    }),
  listCertifications: () => request<CertificationHistoryView>('/strategy-library/certifications'),
  getCertification: (attemptId: string) =>
    request<CertificationAttemptView>(`/strategy-library/certifications/${attemptId}`),
  runRuntimeValidation: (body: RunRuntimeValidationRequest) =>
    request<RuntimeValidationView>('/runtime-validations', {
      method: 'POST',
      body: JSON.stringify(body),
    }),
  listRuntimeValidations: () => request<RuntimeValidationHistoryView>('/runtime-validations'),
  getRuntimeValidation: (validationId: string) =>
    request<RuntimeValidationView>(`/runtime-validations/${validationId}`),
  createStrategyDeployment: (body: CreateStrategyDeploymentRequest, idempotencyKey: string) =>
    request<StrategyDeploymentView>('/strategy-deployments', {
      method: 'POST',
      headers: { 'Idempotency-Key': idempotencyKey },
      body: JSON.stringify(body),
    }),
  approveStrategyDeployment: (deploymentId: string) =>
    request<StrategyDeploymentView>(`/strategy-deployments/${deploymentId}/approve`, {
      method: 'POST',
      body: '{}',
    }),
  listStrategyDeployments: () => request<StrategyDeploymentView[]>('/strategy-deployments'),
  getStrategyDeployment: (deploymentId: string) =>
    request<StrategyDeploymentView>(`/strategy-deployments/${deploymentId}`),
  createOrchestrationPlan: (body: CreateOrchestrationPlanRequest) =>
    request<OrchestrationPlanView>('/orchestrations/plans', {
      method: 'POST',
      body: JSON.stringify(body),
    }),
  listOrchestrationPlans: () => request<OrchestrationPlanListView>('/orchestrations/plans'),
  getOrchestrationPlan: (planId: string) =>
    request<OrchestrationPlanView>(`/orchestrations/plans/${planId}`),
  requestOrchestrationRun: (body: RequestOrchestrationRunRequest) =>
    request<OrchestrationCommandView>('/orchestrations/runs', {
      method: 'POST',
      body: JSON.stringify(body),
    }),
  listOrchestrationRuns: () => request<OrchestrationHistoryView>('/orchestrations/runs'),
  getOrchestrationRun: (runId: string) =>
    request<OrchestrationRunDetailView>(`/orchestrations/runs/${runId}`),
  confirmOrchestrationRun: (runId: string) =>
    request<OrchestrationCommandView>(`/orchestrations/runs/${runId}/confirm`, {
      method: 'POST',
      body: '{}',
    }),
  cancelOrchestrationRun: (runId: string, reason?: string) =>
    request<OrchestrationCommandView>(`/orchestrations/runs/${runId}/cancel`, {
      method: 'POST',
      body: JSON.stringify({ reason }),
    }),
  proposeOrchestrationSelection: (runId: string, body: ProposeOrchestrationSelectionRequest) =>
    request<OrchestrationCommandView>(`/orchestrations/runs/${runId}/selections`, {
      method: 'POST',
      body: JSON.stringify(body),
    }),
  emitOrchestrationHandoff: (runId: string, body: EmitOrchestrationHandoffRequest) =>
    request<OrchestrationCommandView>(`/orchestrations/runs/${runId}/handoff`, {
      method: 'POST',
      body: JSON.stringify(body),
    }),
  getSessionHandoffIntent: (sessionHandoffIntentId: string) =>
    request<SessionHandoffIntentView>(`/orchestrations/handoffs/${sessionHandoffIntentId}`),
  listReportRuns: (query: ReportRunListQuery = {}) => {
    const params = new URLSearchParams();
    if (query.reportDefinitionId) params.set('reportDefinitionId', query.reportDefinitionId);
    if (query.kind) params.set('kind', query.kind);
    if (query.status) params.set('status', query.status);
    if (query.mode) params.set('mode', query.mode);
    if (query.tradingSessionId) params.set('tradingSessionId', query.tradingSessionId);
    if (query.q?.trim()) params.set('q', query.q.trim());
    if (query.limit) params.set('limit', String(query.limit));
    const qs = params.toString();
    return request<ReportRunPageView>(`/report-runs${qs ? `?${qs}` : ''}`);
  },
  getReportRun: (reportRunId: string) =>
    request<ReportRunDetailView>(`/report-runs/${reportRunId}`),
  listKnowledgeLake: (query: KnowledgeLakeListQuery = {}) => {
    const qs = knowledgeLakeQueryString(query);
    return request<KnowledgeLakePageView>(`/knowledge-lake${qs ? `?${qs}` : ''}`);
  },
  searchKnowledgeLake: (query: KnowledgeLakeListQuery = {}) => {
    const qs = knowledgeLakeQueryString(query);
    return request<KnowledgeLakePageView>(`/knowledge-lake/search${qs ? `?${qs}` : ''}`);
  },
  listKnowledgeLakeHistory: (query: KnowledgeLakeListQuery = {}) => {
    const qs = knowledgeLakeQueryString(query);
    return request<KnowledgeLakeHistoryPageView>(`/knowledge-lake/history${qs ? `?${qs}` : ''}`);
  },
  getKnowledgeLakeRelationships: (entryId: string) =>
    request<{
      entryId: string;
      items: KnowledgeLakeRelationshipView[];
      authorityClass: 'projection';
      ledgerSoT: false;
    }>(`/knowledge-lake/relationships?entryId=${encodeURIComponent(entryId)}`),
  getKnowledgeLakeProvenance: (entryId: string) =>
    request<KnowledgeLakeProvenanceView>(
      `/knowledge-lake/provenance?entryId=${encodeURIComponent(entryId)}`,
    ),
  getKnowledgeLakeEntry: (entryId: string) =>
    request<KnowledgeLakeDetailView>(`/knowledge-lake/${entryId}`),
  listAiAnalytics: (query: AiAnalyticsListQuery = {}) => {
    const qs = aiAnalyticsQueryString(query);
    return request<AiAnalyticsPageView>(`/ai-analytics${qs ? `?${qs}` : ''}`);
  },
  listAiAnalyticsHistory: (query: AiAnalyticsListQuery = {}) => {
    const qs = aiAnalyticsQueryString(query);
    return request<AiAnalyticsHistoryPageView>(`/ai-analytics/history${qs ? `?${qs}` : ''}`);
  },
  getAiAnalyticsProvenance: (analysisId: string) =>
    request<AiAnalyticsProvenanceView>(
      `/ai-analytics/provenance?analysisId=${encodeURIComponent(analysisId)}`,
    ),
  getAiAnalytics: (analysisId: string) =>
    request<AiAnalyticsDetailView>(`/ai-analytics/${encodeURIComponent(analysisId)}`),
  generateAiAnalytics: (body: GenerateAiAnalyticsRequest) =>
    request<AiAnalyticsDetailView>('/ai-analytics/generate', {
      method: 'POST',
      body: JSON.stringify(body),
    }),
  listReportDefinitions: (kind?: string) =>
    request<ReportDefinitionPageView>(
      `/report-definitions${kind ? `?kind=${encodeURIComponent(kind)}` : ''}`,
    ),
  getReportDefinition: (reportDefinitionId: string) =>
    request<ReportDefinitionView>(`/report-definitions/${reportDefinitionId}`),
  getNotificationSettings: () => request<NotificationSettingsView>('/notification-settings'),
  getNotificationPreferences: () =>
    request<NotificationPreferencesView>('/notification-preferences'),
  upsertNotificationPreferences: (body: UpsertNotificationPreferencesRequest) =>
    request<NotificationPreferencesView>('/notification-preferences', {
      method: 'PUT',
      body: JSON.stringify(body),
    }),
  listNotificationChannels: () =>
    request<{ items: NotificationChannelView[]; deferredChannelsActivated: false }>(
      '/notification-channels',
    ),
  getNotificationChannelsWorkspace: () =>
    request<NotificationChannelsWorkspaceView>('/notification-channels/workspace'),
  getNotificationChannel: (channelId: string) =>
    request<NotificationChannelDetailView>(`/notification-channels/${channelId}`),
  getNotificationChannelDiagnostics: (channelId: string) =>
    request<NotificationChannelDiagnosticsView>(`/notification-channels/${channelId}/diagnostics`),
  listNotificationChannelDeliveries: (
    channelId: string,
    query: NotificationDeliveryListQuery = {},
  ) => {
    const params = new URLSearchParams();
    if (query.userId) params.set('userId', query.userId);
    if (query.reportRunId) params.set('reportRunId', query.reportRunId);
    if (query.type) params.set('type', query.type);
    if (query.outcome) params.set('outcome', query.outcome);
    if (query.q?.trim()) params.set('q', query.q.trim());
    if (query.limit) params.set('limit', String(query.limit));
    const qs = params.toString();
    return request<NotificationDeliveryPageView>(
      `/notification-channels/${channelId}/deliveries${qs ? `?${qs}` : ''}`,
    );
  },
  getNotificationRouting: () => request<NotificationRoutingView>('/notification-routing'),
  listNotificationDeliveries: (query: NotificationDeliveryListQuery = {}) => {
    const params = new URLSearchParams();
    if (query.userId) params.set('userId', query.userId);
    if (query.reportRunId) params.set('reportRunId', query.reportRunId);
    if (query.type) params.set('type', query.type);
    if (query.outcome) params.set('outcome', query.outcome);
    if (query.q?.trim()) params.set('q', query.q.trim());
    if (query.limit) params.set('limit', String(query.limit));
    const qs = params.toString();
    return request<NotificationDeliveryPageView>(`/notification-deliveries${qs ? `?${qs}` : ''}`);
  },
  getNotificationDelivery: (deliveryId: string) =>
    request<NotificationDeliveryDetailView>(`/notification-deliveries/${deliveryId}`),
  getTelegramConnection: () => request<TelegramConnectionProductView>('/telegram/connection'),
  connectTelegram: () =>
    request<TelegramConnectProductView>('/telegram/connect', {
      method: 'POST',
      body: JSON.stringify({}),
    }),
  completeTelegramConnect: () =>
    request<TelegramConnectionProductView>('/telegram/complete', {
      method: 'POST',
      body: JSON.stringify({}),
    }),
  verifyTelegramConnection: () =>
    request<TelegramConnectionProductView>('/telegram/verify', {
      method: 'POST',
      body: JSON.stringify({}),
    }),
  disconnectTelegram: () =>
    request<TelegramConnectionProductView>('/telegram/disconnect', {
      method: 'POST',
      body: JSON.stringify({}),
    }),
  sendTelegramTest: () =>
    request<TelegramTestProductView>('/telegram/test', {
      method: 'POST',
      body: JSON.stringify({}),
    }),
  getTelegramDiagnostics: () => request<TelegramDiagnosticsView>('/telegram/diagnostics'),
  listTelegramDeliveries: (query: NotificationDeliveryListQuery = {}) => {
    const params = new URLSearchParams();
    if (query.userId) params.set('userId', query.userId);
    if (query.reportRunId) params.set('reportRunId', query.reportRunId);
    if (query.type) params.set('type', query.type);
    if (query.outcome) params.set('outcome', query.outcome);
    if (query.q?.trim()) params.set('q', query.q.trim());
    if (query.limit) params.set('limit', String(query.limit));
    const qs = params.toString();
    return request<NotificationDeliveryPageView>(`/telegram/deliveries${qs ? `?${qs}` : ''}`);
  },
  getTelegramDelivery: (deliveryId: string) =>
    request<NotificationDeliveryDetailView>(`/telegram/deliveries/${deliveryId}`),
  importDataset: () =>
    request<{ dataset: Dataset; created: boolean }>('/datasets/import/binance', {
      method: 'POST',
      body: JSON.stringify({ symbol: 'BTCUSDT', timeframe: '1h', limit: 1000 }),
    }),
  listDatasets: () => request<Dataset[]>('/datasets'),
  listExperiments: () => request<Experiment[]>('/experiments'),
  runExperiment: (datasetId: string) =>
    request<Experiment>('/experiments', {
      method: 'POST',
      body: JSON.stringify({ datasetId }),
    }),
  getExperiment: (id: string) => request<Experiment>(`/experiments/${id}`),
  startWorkflow: (datasetId: string, approveNeedsReview = false) =>
    request<Workflow>('/workflows', {
      method: 'POST',
      body: JSON.stringify({ type: 'research_pipeline', datasetId, approveNeedsReview }),
    }),
  listWorkflows: () => request<Workflow[]>('/workflows'),
  getWorkflow: (id: string) => request<Workflow>(`/workflows/${id}`),
  listKnowledge: (params?: { q?: string; type?: string; category?: string }) => {
    const query = new URLSearchParams();
    if (params?.q) query.set('q', params.q);
    if (params?.type) query.set('type', params.type);
    if (params?.category) query.set('category', params.category);
    const qs = query.toString();
    return request<KnowledgeEntry[]>(`/knowledge${qs ? `?${qs}` : ''}`);
  },
  listStrategies: () => request<Strategy[]>('/strategies'),
  getStrategy: (id: string) => request<Strategy>(`/strategies/${id}`),
  createStrategy: (body: CreateStrategyRequest) =>
    request<Strategy>('/strategies', {
      method: 'POST',
      body: JSON.stringify(body),
    }),
  updateStrategy: (id: string, body: UpdateStrategyRequest) =>
    request<Strategy>(`/strategies/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(body),
    }),
  deleteStrategy: (id: string) =>
    // Empty JSON body: the shared client always sends Content-Type:
    // application/json and Fastify rejects an empty body with that type.
    request<{ id: string; deleted: boolean }>(`/strategies/${id}`, {
      method: 'DELETE',
      body: JSON.stringify({}),
    }),
  runCampaign,
  listCampaignHistory,
  exportCampaignHistory,
  analyzeCampaign,
  runMultiDatasetCampaign,
  runWalkForwardCampaign,
  aiExecute: (task: string, context: Record<string, unknown>) =>
    request<{ content: string; provider: string; model: string }>('/ai/execute', {
      method: 'POST',
      body: JSON.stringify({ task, context }),
    }),
  listEvents: () => request<Array<{ id: string; type: string; createdAt: string }>>('/events'),
  listDeployments: () => request<Deployment[]>('/production/deployments'),
  getDeployment: (id: string) => request<Deployment>(`/production/deployments/${id}`),
  listExecutions: (deploymentId?: string) =>
    request<Execution[]>(
      `/production/executions${deploymentId ? `?deploymentId=${deploymentId}` : ''}`,
    ),
  getPortfolio: () => request<PortfolioView>('/portfolio'),
  getPortfolioBalance: () => request<PortfolioBalance>('/portfolio/balance'),
  getPortfolioEquity: () => request<PortfolioEquity>('/portfolio/equity'),
  getPortfolioMargin: () => request<PortfolioMargin>('/portfolio/margin'),
  listPortfolioSnapshots: () =>
    request<
      Array<{
        id: string;
        portfolioId: string;
        timestamp: string;
        balance: PortfolioBalance;
        equity: PortfolioEquity;
        margin: PortfolioMargin;
        realizedPnL: string;
        unrealizedPnL: string;
      }>
    >('/portfolio/snapshots'),
  resetPortfolio: () =>
    request<PortfolioView>('/portfolio/reset', {
      method: 'POST',
      body: '{}',
    }),
  listPositions: () => request<PositionView[]>('/positions'),
  listOpenPositions: () => request<PositionView[]>('/positions/open'),
  getPosition: (id: string) => request<PositionView>(`/positions/${id}`),
  listPositionHistory: (positionId?: string) =>
    request<PositionHistoryEntry[]>(
      `/positions/history${positionId ? `?positionId=${encodeURIComponent(positionId)}` : ''}`,
    ),
  markPositionPrice: (body: { positionId: string; markPrice: string }) =>
    request<PositionView>('/positions/mark-price', {
      method: 'PATCH',
      body: JSON.stringify(body),
    }),
  listOrders: () => request<OrderView[]>('/trading-orders'),
  listOpenOrders: () => request<OrderView[]>('/trading-orders/open'),
  getOrder: (id: string) => request<OrderView>(`/trading-orders/${id}`),
  listOrderHistory: (orderId?: string) =>
    request<OrderHistoryEntry[]>(
      `/trading-orders/history${orderId ? `?orderId=${encodeURIComponent(orderId)}` : ''}`,
    ),
  listOrderFills: (orderId: string) =>
    request<OrderFillEntry[]>(`/trading-orders/${orderId}/fills`),
  createOrder: (body: {
    symbol: string;
    side: string;
    type: string;
    quantity: string;
    requestedPrice?: string | null;
    timeInForce?: string;
  }) =>
    request<OrderView>('/trading-orders', {
      method: 'POST',
      body: JSON.stringify(body),
    }),
  cancelOrder: (id: string, reason?: string) =>
    request<OrderView>(`/trading-orders/${id}/cancel`, {
      method: 'POST',
      body: JSON.stringify(reason ? { reason } : {}),
    }),
  executeOrder: (id: string, body: { quantity?: string; price: string; fee?: string }) =>
    request<OrderView>(`/trading-orders/${id}/execute`, {
      method: 'POST',
      body: JSON.stringify(body),
    }),
  updateOrder: (
    id: string,
    body: { quantity?: string; requestedPrice?: string | null; timeInForce?: string },
  ) =>
    request<OrderView>(`/trading-orders/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(body),
    }),
  listRiskPolicies: () => request<RiskPolicyView[]>('/risk/policies'),
  listRiskDecisions: () => request<RiskDecisionView[]>('/risk/decisions'),
  listRiskHistory: () => request<RiskDecisionView[]>('/risk/history'),
  getRiskSummary: () => request<RiskSummaryView>('/risk/summary'),
  updateRiskPolicy: (
    id: string,
    body: { enabled?: boolean; priority?: number; configuration?: Record<string, unknown> },
  ) =>
    request<RiskPolicyView>(`/risk/policies/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(body),
    }),
  evaluateRisk: (body: {
    orderId: string;
    symbol: string;
    side: string;
    type: string;
    quantity: string;
    requestedPrice?: string | null;
    referencePrice?: string | null;
  }) =>
    request<{ decision: RiskDecisionView; result: unknown }>('/risk/evaluate', {
      method: 'POST',
      body: JSON.stringify(body),
    }),
  getRuntimeHealth: () => requestAbsolute<RuntimeHealthView>(`${apiUrl}/health`),
  listTradingSessions: () => request<TradingSessionBotView[]>('/trading-sessions'),
  getTradingSession: (id: string) => request<TradingSessionBotView>(`/trading-sessions/${id}`),
  createPaperAccount: (body: {
    currency: string;
    openingCapital: string;
    mode: 'paper';
    idempotencyKey?: string;
  }) =>
    request<PaperAccountView>('/paper-accounts', {
      method: 'POST',
      body: JSON.stringify(body),
    }),
  createTradingSession: (body: {
    paperAccountId: string;
    deploymentId: string;
    origin: 'strategy';
    sessionHandoffIntentId?: string;
    idempotencyKey?: string;
  }) =>
    request<TradingSessionBotView>('/trading-sessions', {
      method: 'POST',
      body: JSON.stringify(body),
    }),
  startTradingSession: (id: string) =>
    request<TradingSessionBotView>(`/trading-sessions/${id}/start`, {
      method: 'POST',
      body: '{}',
    }),
  getDefaultExchangeScope: () => request<ExchangeScopeOverviewView>('/exchange-scopes/default'),
  getExchangeScopeWorkspace: () =>
    request<ExchangeScopeWorkspaceView>('/exchange-scopes/workspace'),
  listExchangeScopeVenues: () =>
    request<{ items: ExchangeVenueCatalogItemView[] } & ExchangeScopeProductFlags>(
      '/exchange-scopes/venues',
    ),
  listExchangeScopes: (lifecycleStatus?: string) =>
    request<ExchangeScopePageView>(
      `/exchange-scopes${lifecycleStatus ? `?lifecycleStatus=${encodeURIComponent(lifecycleStatus)}` : ''}`,
    ),
  getExchangeScope: (exchangeScopeId: string) =>
    request<ExchangeScopeDetailView>(`/exchange-scopes/${encodeURIComponent(exchangeScopeId)}`),
  createExchangeScope: (body: RegisterExchangeScopeRequest) =>
    request<ExchangeScopeCommandView>('/exchange-scopes', {
      method: 'POST',
      body: JSON.stringify(body),
    }),
  activateExchangeScope: (exchangeScopeId: string, reason?: string) =>
    request<ExchangeScopeCommandView>(
      `/exchange-scopes/${encodeURIComponent(exchangeScopeId)}/activate`,
      { method: 'POST', body: JSON.stringify(reason ? { reason } : {}) },
    ),
  suspendExchangeScope: (exchangeScopeId: string, reason?: string) =>
    request<ExchangeScopeCommandView>(
      `/exchange-scopes/${encodeURIComponent(exchangeScopeId)}/suspend`,
      { method: 'POST', body: JSON.stringify(reason ? { reason } : {}) },
    ),
  archiveExchangeScope: (exchangeScopeId: string, reason?: string) =>
    request<ExchangeScopeCommandView>(
      `/exchange-scopes/${encodeURIComponent(exchangeScopeId)}/archive`,
      { method: 'POST', body: JSON.stringify(reason ? { reason } : {}) },
    ),
  renameExchangeScope: (exchangeScopeId: string, displayName: string) =>
    request<ExchangeScopeCommandView>(
      `/exchange-scopes/${encodeURIComponent(exchangeScopeId)}/rename`,
      { method: 'POST', body: JSON.stringify({ displayName }) },
    ),
  updateExchangeScopeConfig: (exchangeScopeId: string, body: UpdateExchangeScopeConfigRequest) =>
    request<ExchangeScopeCommandView>(
      `/exchange-scopes/${encodeURIComponent(exchangeScopeId)}/config`,
      { method: 'PUT', body: JSON.stringify(body) },
    ),
  publishExchangeScopePolicy: (
    exchangeScopeId: string,
    limits: { maxExposureLabel: string; maxOrderNotionalLabel: string; notes?: string },
  ) =>
    request<ExchangeScopeCommandView>(
      `/exchange-scopes/${encodeURIComponent(exchangeScopeId)}/policy`,
      { method: 'POST', body: JSON.stringify({ limits }) },
    ),
  bindExchangeScopeAccount: (exchangeScopeId: string, tradingAccountId: string) =>
    request<ExchangeScopeCommandView>(
      `/exchange-scopes/${encodeURIComponent(exchangeScopeId)}/bindings`,
      { method: 'POST', body: JSON.stringify({ tradingAccountId }) },
    ),
  unbindExchangeScopeAccount: (exchangeScopeId: string, bindingId: string) =>
    request<ExchangeScopeCommandView>(
      `/exchange-scopes/${encodeURIComponent(exchangeScopeId)}/bindings/${encodeURIComponent(bindingId)}/unbind`,
      { method: 'POST', body: '{}' },
    ),
  getQualificationWorkspace: () => request<QualificationWorkspaceView>('/qualification/workspace'),
  listQualificationTargets: () => request<QualificationTargetPageView>('/qualification/targets'),
  getQualificationTarget: (targetId: string) =>
    request<QualificationTargetDetailView>(
      `/qualification/targets/${encodeURIComponent(targetId)}`,
    ),
  listQualificationRuns: (query: { targetId?: string; status?: string } = {}) => {
    const params = new URLSearchParams();
    if (query.targetId) params.set('targetId', query.targetId);
    if (query.status) params.set('status', query.status);
    const qs = params.toString();
    return request<QualificationRunPageView>(`/qualification/runs${qs ? `?${qs}` : ''}`);
  },
  getQualificationRun: (qualificationRunId: string) =>
    request<QualificationRunDetailView>(
      `/qualification/runs/${encodeURIComponent(qualificationRunId)}`,
    ),
  requestQualificationRun: (body: RequestQualificationRunRequest) =>
    request<QualificationCommandView>('/qualification/runs', {
      method: 'POST',
      body: JSON.stringify(body),
    }),
  confirmQualificationRun: (qualificationRunId: string) =>
    request<QualificationCommandView>(
      `/qualification/runs/${encodeURIComponent(qualificationRunId)}/confirm`,
      { method: 'POST', body: '{}' },
    ),
  cancelQualificationRun: (qualificationRunId: string) =>
    request<QualificationCommandView>(
      `/qualification/runs/${encodeURIComponent(qualificationRunId)}/cancel`,
      { method: 'POST', body: '{}' },
    ),
  completeQualificationRun: (qualificationRunId: string) =>
    request<QualificationCommandView>(
      `/qualification/runs/${encodeURIComponent(qualificationRunId)}/complete`,
      { method: 'POST', body: '{}' },
    ),
  failQualificationRun: (qualificationRunId: string, reasons: readonly string[]) =>
    request<QualificationCommandView>(
      `/qualification/runs/${encodeURIComponent(qualificationRunId)}/fail`,
      { method: 'POST', body: JSON.stringify({ reasons }) },
    ),
  requalifyQualificationTarget: (targetId: string, modeContext: 'lab' | 'paper') =>
    request<QualificationCommandView>(
      `/qualification/targets/${encodeURIComponent(targetId)}/requalify`,
      { method: 'POST', body: JSON.stringify({ modeContext }) },
    ),
  getMarketProfileWorkspace: () =>
    request<MarketProfileWorkspaceView>('/market-profiles/workspace'),
  listLatestMarketProfiles: () => request<MarketProfilePageView>('/market-profiles'),
  listMarketProfileHistory: (query: { targetId?: string } = {}) => {
    const params = new URLSearchParams();
    if (query.targetId) params.set('targetId', query.targetId);
    const qs = params.toString();
    return request<MarketProfileVersionPageView>(`/market-profiles/history${qs ? `?${qs}` : ''}`);
  },
  getMarketProfileTarget: (targetId: string) =>
    request<MarketProfileTargetDetailView>(
      `/market-profiles/targets/${encodeURIComponent(targetId)}`,
    ),
  getLatestMarketProfile: (targetId: string) =>
    request<MarketProfileDetailView>(
      `/market-profiles/targets/${encodeURIComponent(targetId)}/latest`,
    ),
  getMarketProfileVersion: (targetId: string, version: number) =>
    request<MarketProfileDetailView>(
      `/market-profiles/targets/${encodeURIComponent(targetId)}/versions/${version}`,
    ),
  compareMarketProfileVersions: (targetId: string, fromVersion: number, toVersion: number) =>
    request<MarketProfileCompareView>(
      `/market-profiles/targets/${encodeURIComponent(targetId)}/compare?fromVersion=${fromVersion}&toVersion=${toVersion}`,
    ),
  getMarketStateWorkspace: () => request<MarketStateWorkspaceView>('/market-states/workspace'),
  listCurrentMarketStates: () => request<MarketStatePageView>('/market-states'),
  listMarketStateHistory: (query: { targetId?: string } = {}) => {
    const params = new URLSearchParams();
    if (query.targetId) params.set('targetId', query.targetId);
    const qs = params.toString();
    return request<MarketStateVersionPageView>(`/market-states/history${qs ? `?${qs}` : ''}`);
  },
  getMarketStateTarget: (targetId: string) =>
    request<MarketStateTargetDetailView>(`/market-states/targets/${encodeURIComponent(targetId)}`),
  getCurrentMarketState: (targetId: string) =>
    request<MarketStateDetailView>(
      `/market-states/targets/${encodeURIComponent(targetId)}/current`,
    ),
  getMarketStateVersion: (targetId: string, version: number) =>
    request<MarketStateDetailView>(
      `/market-states/targets/${encodeURIComponent(targetId)}/versions/${version}`,
    ),
  refreshMarketState: (targetId: string, notes?: string) =>
    request<MarketStateRefreshView>(
      `/market-states/targets/${encodeURIComponent(targetId)}/refresh`,
      { method: 'POST', body: JSON.stringify({ notes }) },
    ),
  pauseTradingSession: (id: string) =>
    request<TradingSessionBotView>(`/trading-sessions/${id}/pause`, {
      method: 'POST',
      body: '{}',
    }),
  resumeTradingSession: (id: string) =>
    request<TradingSessionBotView>(`/trading-sessions/${id}/resume`, {
      method: 'POST',
      body: '{}',
    }),
  stopTradingSession: (id: string) =>
    request<TradingSessionBotView>(`/trading-sessions/${id}/stop`, {
      method: 'POST',
      body: '{}',
    }),
  listPaperSessions: () => request<PaperSessionView[]>('/paper/sessions'),
  getPaperSession: (id: string) => request<PaperSessionView>(`/paper/sessions/${id}`),
  createPaperSession: (body: { name: string; initialBalance?: string }) =>
    request<PaperSessionView>('/paper/sessions', {
      method: 'POST',
      body: JSON.stringify(body),
    }),
  startPaperSession: (id: string) =>
    request<PaperSessionView>(`/paper/sessions/${id}/start`, {
      method: 'POST',
      body: '{}',
    }),
  pausePaperSession: (id: string) =>
    request<PaperSessionView>(`/paper/sessions/${id}/pause`, {
      method: 'POST',
      body: '{}',
    }),
  stopPaperSession: (id: string) =>
    request<PaperSessionView>(`/paper/sessions/${id}/stop`, {
      method: 'POST',
      body: '{}',
    }),
  deletePaperSession: (id: string) =>
    request<{ id: string; deleted: boolean }>(`/paper/sessions/${id}`, {
      method: 'DELETE',
      body: JSON.stringify({}),
    }),
  listPaperSessionOrders: (id: string) => request<OrderView[]>(`/paper/sessions/${id}/orders`),
  listPaperSessionPositions: (id: string) =>
    request<PositionView[]>(`/paper/sessions/${id}/positions`),
  getPaperSessionPortfolio: (id: string) =>
    request<PortfolioView>(`/paper/sessions/${id}/portfolio`),
  listPaperSessionExecutions: (id: string) =>
    request<PaperExecutionView[]>(`/paper/sessions/${id}/executions`),
  getPaperSessionStatistics: (id: string) =>
    request<PaperSessionStatistics>(`/paper/sessions/${id}/statistics`),
  listExchanges: () => request<ExchangeView[]>('/exchanges'),
  getExchangeStatus: () => request<ExchangeStatusView>('/exchanges/status'),
  getExchange: (id: string) => request<ExchangeView>(`/exchanges/${id}`),
  getExchangeCapabilities: (id: string) =>
    request<ExchangeCapabilitiesView>(`/exchanges/${id}/capabilities`),
  connectExchange: (exchangeId: string) =>
    request<ExchangeConnectionView>('/exchanges/connect', {
      method: 'POST',
      body: JSON.stringify({ exchangeId }),
    }),
  disconnectExchange: (exchangeId: string, reason?: string | null) =>
    request<ExchangeConnectionView>('/exchanges/disconnect', {
      method: 'POST',
      body: JSON.stringify({ exchangeId, reason: reason ?? null }),
    }),
  listLiveSessions: () => request<LiveSessionView[]>('/live/sessions'),
  getLiveStatus: () => request<LiveStatusView>('/live/status'),
  getLiveHealth: () => request<LiveWorkspaceHealthView>('/live/health'),
  getLiveSynchronization: () => request<LiveSynchronizationView>('/live/synchronization'),
  startLiveSession: (body: { exchange: string; accountId: string; sessionId?: string }) =>
    request<LiveSessionView>('/live/start', {
      method: 'POST',
      body: JSON.stringify(body),
    }),
  stopLiveSession: (sessionId: string) =>
    request<LiveSessionView>('/live/stop', {
      method: 'POST',
      body: JSON.stringify({ sessionId }),
    }),
  pauseLiveSession: (sessionId: string) =>
    request<LiveSessionView>('/live/pause', {
      method: 'POST',
      body: JSON.stringify({ sessionId }),
    }),
  resumeLiveSession: (sessionId: string) =>
    request<LiveSessionView>('/live/resume', {
      method: 'POST',
      body: JSON.stringify({ sessionId }),
    }),
  reconnectLiveSession: (sessionId: string) =>
    request<{
      session: LiveSessionView;
      replayedExecutions: number;
      skippedDuplicates: number;
    }>('/live/reconnect', {
      method: 'POST',
      body: JSON.stringify({ sessionId }),
    }),
  synchronizeLiveSession: (sessionId: string) =>
    request<{
      session: LiveSessionView;
      inconsistencies: unknown[];
      balances: number;
      positions: number;
      openOrders: number;
    }>('/live/synchronize', {
      method: 'POST',
      body: JSON.stringify({ sessionId }),
    }),
  activateKillSwitch: (sessionId: string, body?: { closePositions?: boolean; reason?: string }) =>
    request<{
      session: LiveSessionView;
      cancelledOrders: number;
      closedPositions: number;
      strategyDisabled: boolean;
      tradingFrozen: boolean;
      reason: string;
    }>('/live/kill-switch', {
      method: 'POST',
      body: JSON.stringify({ sessionId, ...body }),
    }),
  clearKillSwitch: (sessionId: string) =>
    request<LiveSessionView>('/live/kill-switch/clear', {
      method: 'POST',
      body: JSON.stringify({ sessionId }),
    }),
  submitLiveOrder: (body: {
    sessionId: string;
    symbol: string;
    side: string;
    type: string;
    quantity: string;
    requestedPrice?: string | null;
    timeInForce?: string;
  }) =>
    request<LiveOrderResult>('/live/orders', {
      method: 'POST',
      body: JSON.stringify(body),
    }),
  listLiveSessionOrders: (id: string) => request<OrderView[]>(`/live/sessions/${id}/orders`),
  listLiveSessionPositions: (id: string) =>
    request<PositionView[]>(`/live/sessions/${id}/positions`),
  getLiveSessionPortfolio: (id: string) => request<PortfolioView>(`/live/sessions/${id}/portfolio`),
  listLiveSessionEvents: (id: string) => request<LiveEventView[]>(`/live/sessions/${id}/events`),
};

export function verdictColor(verdict: string) {
  if (verdict === 'pass') return 'text-emerald-300 border-emerald-500/30 bg-emerald-500/10';
  if (verdict === 'needs_review') return 'text-amber-300 border-amber-500/30 bg-amber-500/10';
  if (verdict === 'completed' || verdict === 'active' || verdict === 'filled') {
    return 'text-emerald-300 border-emerald-500/30 bg-emerald-500/10';
  }
  return 'text-red-300 border-red-500/30 bg-red-500/10';
}

export function statusColor(status: string) {
  if (status === 'active' || status === 'completed' || status === 'filled' || status === 'pass') {
    return 'text-emerald-300 border-emerald-500/30 bg-emerald-500/10';
  }
  if (status === 'running' || status === 'needs_review') {
    return 'text-amber-300 border-amber-500/30 bg-amber-500/10';
  }
  return 'text-slate-300 border-slate-500/30 bg-slate-500/10';
}
