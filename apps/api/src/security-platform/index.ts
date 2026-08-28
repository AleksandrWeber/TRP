export {
  assertSecurityPlatformBoot,
  collectSecurityPlatformIssues,
  loadSecurityPlatformConfig,
  resolveNestThrottlerOptions,
  SecurityPlatformBootError,
  verifySecurityPlatformConfig,
  type NestThrottlerOptions,
  type SecurityPlatformConfig,
  type SecurityPlatformVerificationResult,
} from './security-config';
export {
  isExistenceOracleMessage,
  PLATFORM_ACCESS_DENIED_MESSAGE,
  shapePlatformDeny,
  type PlatformDenyShape,
} from './anti-enumeration';
export {
  ABUSE_LIMIT_MESSAGE,
  isSensitiveAbusePath,
  PlatformAbuseProtector,
  type AbuseQuota,
  type AbuseThrottleDecision,
  type PlatformAbusePolicy,
} from './platform-abuse-protection';
export { errorResponseLeaksInternals, sanitizeClientError } from './security-error';
export {
  normalizeIncomingQuery,
  PARAMETER_POLLUTION_MESSAGE,
  type QueryNormalizationResult,
} from './request-normalization';
export {
  createPlatformValidationPipe,
  PLATFORM_VALIDATION_FOUNDATION,
} from './validation-foundation';
export {
  BROWSER_SECURITY_HEADER_NAMES,
  collectBrowserSecurityIssues,
  createBrowserSecurityPolicy,
  createWebBrowserSecurityHeaders,
} from './browser-security';
export { validateOpenRedirectTarget, type OpenRedirectValidationResult } from './open-redirect';
export {
  validateOutboundSsrfTarget,
  type SsrfBlockReason,
  type SsrfValidationResult,
} from './ssrf-allowlist';
export { emitPlatformSecurityEvent, type PlatformSecurityEvent } from './security-event';
export { registerSecurityPlatformHttpHooks } from './security-platform.http';
export { PlatformSecurityExceptionFilter } from './platform-security-exception.filter';
export { SecurityPlatformBootstrap } from './security-platform.bootstrap';
export { SecurityPlatformModule } from './security-platform.module';
export {
  MONITORING_HEALTH_STATE_REPOSITORY,
  type MonitoringHealthStateRepository,
} from './monitoring-health/domain/monitoring-health-state.repository';
export {
  MONITORING_HEALTH_STATE_SCHEMA_VERSION,
  buildConnectionHealthAnchorState,
  buildSecurityHealthAnchorState,
  type DurableMonitoringHealthState,
  type MonitoringHealthPersistenceOutcome,
} from './monitoring-health/domain/durable-monitoring-health-state';
export {
  MonitoringHealthPersistenceService,
  type PersistConnectionHealthAnchorCommand,
  type PersistSecurityHealthAnchorCommand,
} from './monitoring-health/monitoring-health-persistence.service';
export { MonitoringHealthRecoveryStore } from './monitoring-health/monitoring-health-recovery-store';
export { MonitoringHealthRestartRecoveryService } from './monitoring-health/monitoring-health-restart-recovery.service';
export {
  MonitoringHealthRestartRecoveryError,
  assertRecoverableMonitoringHealthState,
  buildMonitoringHealthRecoveryDiagnostics,
  prepareMonitoringHealthStatesForRecovery,
  sortMonitoringHealthStatesDeterministically,
  W3_O05_C_MONITORING_RECOVERY_OWNER,
  type MonitoringHealthRecoveryDiagnostics,
} from './monitoring-health/domain/monitoring-health-restart-recovery';
