/**
 * Product Owner-approved event admission catalogue (V3-S05-a).
 * Each entry answers one future investigation question. The payload schema is
 * intentionally fixed per event type so equivalent facts have one audit story.
 */
export type SecurityAuditEventClass =
  | 'authentication'
  | 'session'
  | 'recovery'
  | 'authorization'
  | 'privilege'
  | 'vault'
  | 'security-platform';

export type SecurityAuditCriticality = 'critical' | 'high';
export type SecurityAuditRetention = 'long' | 'longest' | 'medium-long';

export type SecurityAuditClassification = Readonly<{
  eventClass: SecurityAuditEventClass;
  criticality: SecurityAuditCriticality;
  investigationValue: string;
  customerTrustValue: 'critical' | 'high' | 'medium';
  securityImpact: 'critical' | 'high' | 'medium';
  financialIntegrityValue: 'critical' | 'high' | 'medium';
  retention: SecurityAuditRetention;
}>;

const CATALOG: Readonly<Record<string, SecurityAuditClassification>> = Object.freeze({
  'auth.login': {
    eventClass: 'authentication',
    criticality: 'critical',
    investigationValue: 'Was an account sign-in accepted, refused, or locked?',
    customerTrustValue: 'high',
    securityImpact: 'critical',
    financialIntegrityValue: 'high',
    retention: 'long',
  },
  'auth.session': {
    eventClass: 'session',
    criticality: 'critical',
    investigationValue: 'Which account session was created, ended, or revoked?',
    customerTrustValue: 'critical',
    securityImpact: 'critical',
    financialIntegrityValue: 'high',
    retention: 'long',
  },
  'auth.recover': {
    eventClass: 'recovery',
    criticality: 'high',
    investigationValue: 'Did account recovery complete, fail, or remain unavailable?',
    customerTrustValue: 'critical',
    securityImpact: 'high',
    financialIntegrityValue: 'high',
    retention: 'long',
  },
  'authz.role-change': {
    eventClass: 'privilege',
    criticality: 'critical',
    investigationValue: 'Who changed a role, or was refused a role change?',
    customerTrustValue: 'high',
    securityImpact: 'critical',
    financialIntegrityValue: 'critical',
    retention: 'longest',
  },
  'authz.deny': {
    eventClass: 'authorization',
    criticality: 'critical',
    investigationValue: 'Which privileged action did the platform refuse?',
    customerTrustValue: 'high',
    securityImpact: 'critical',
    financialIntegrityValue: 'high',
    retention: 'long',
  },
  'vault.lifecycle': {
    eventClass: 'vault',
    criticality: 'critical',
    investigationValue: 'Who changed the availability of a credential?',
    customerTrustValue: 'high',
    securityImpact: 'critical',
    financialIntegrityValue: 'critical',
    retention: 'longest',
  },
  'vault.access-denied': {
    eventClass: 'vault',
    criticality: 'critical',
    investigationValue: 'Did the platform refuse an attempt to access a credential?',
    customerTrustValue: 'high',
    securityImpact: 'critical',
    financialIntegrityValue: 'critical',
    retention: 'longest',
  },
  'platform.abuse.throttled': {
    eventClass: 'security-platform',
    criticality: 'high',
    investigationValue: 'Was a request throttled as a possible abuse attempt?',
    customerTrustValue: 'medium',
    securityImpact: 'high',
    financialIntegrityValue: 'medium',
    retention: 'medium-long',
  },
  'platform.deny.shaped': {
    eventClass: 'security-platform',
    criticality: 'high',
    investigationValue: 'Did the platform return a hardened denial?',
    customerTrustValue: 'medium',
    securityImpact: 'high',
    financialIntegrityValue: 'medium',
    retention: 'medium-long',
  },
});

export function securityAuditClassificationFor(
  eventType: string,
): SecurityAuditClassification | undefined {
  return CATALOG[eventType];
}

export function isClassifiedSecurityAuditEvent(eventType: string): boolean {
  return securityAuditClassificationFor(eventType) !== undefined;
}
